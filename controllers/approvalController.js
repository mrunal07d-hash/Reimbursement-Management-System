const Expense = require('../models/Expense');
const Company = require('../models/Company');

const checkConditionalApproval = (expense, company) => {
  const rule = company.approvalRules?.find(r => r._id.toString() === expense.approvalRule?.toString());
  if (!rule || !rule.conditions) return null;

  const { conditions } = rule;
  const approvedSteps = expense.approvalSteps.filter(s => s.status === 'approved');
  const totalSteps = expense.approvalSteps.length;

  if (conditions.conditionType === 'specific' || conditions.conditionType === 'hybrid') {
    const specificApproverApproved = approvedSteps.some(s =>
      conditions.specificApproverIds?.some(id => id.toString() === s.approver?.toString())
    );
    if (specificApproverApproved) return 'approved';
  }

  if (conditions.conditionType === 'percentage' || conditions.conditionType === 'hybrid') {
    const percentage = (approvedSteps.length / totalSteps) * 100;
    if (percentage >= (conditions.percentageApproval || 100)) return 'approved';
  }

  return null;
};

const approveExpense = async (req, res) => {
  try {
    const { comment } = req.body;
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      status: 'in_review'
    }).populate('approvalSteps.approver');

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const currentStepIndex = expense.approvalSteps.findIndex(
      s => s.approver?._id?.toString() === req.user._id.toString() && s.status === 'pending'
    );

    if (currentStepIndex === -1) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this expense' });
    }

    expense.approvalSteps[currentStepIndex].status = 'approved';
    expense.approvalSteps[currentStepIndex].comment = comment;
    expense.approvalSteps[currentStepIndex].actionDate = new Date();

    const company = await Company.findById(req.user.company._id);
    const conditionalResult = checkConditionalApproval(expense, company);

    if (conditionalResult === 'approved') {
      expense.status = 'approved';
      expense.approvalSteps.filter(s => s.status === 'pending').forEach(s => s.status = 'skipped');
    } else {
      const nextPending = expense.approvalSteps.find(
        (s, i) => i > currentStepIndex && s.status === 'pending'
      );
      if (!nextPending) {
        const allApproved = expense.approvalSteps.every(s => ['approved', 'skipped'].includes(s.status));
        expense.status = allApproved ? 'approved' : 'in_review';
      }
    }

    await expense.save();
    const populated = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('approvalSteps.approver', 'name email role');

    res.json({ success: true, expense: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const rejectExpense = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ success: false, message: 'Comment is required for rejection' });

    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      status: 'in_review'
    });

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const stepIndex = expense.approvalSteps.findIndex(
      s => s.approver?.toString() === req.user._id.toString() && s.status === 'pending'
    );

    if (stepIndex === -1) return res.status(403).json({ success: false, message: 'Not authorized' });

    expense.approvalSteps[stepIndex].status = 'rejected';
    expense.approvalSteps[stepIndex].comment = comment;
    expense.approvalSteps[stepIndex].actionDate = new Date();
    expense.status = 'rejected';
    expense.finalComment = comment;

    await expense.save();
    const populated = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('approvalSteps.approver', 'name email role');

    res.json({ success: true, expense: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const overrideApproval = async (req, res) => {
  try {
    const { action, comment } = req.body;
    const expense = await Expense.findOne({ _id: req.params.id, company: req.user.company._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    expense.status = action === 'approve' ? 'approved' : 'rejected';
    expense.finalComment = comment;
    expense.approvalSteps.filter(s => s.status === 'pending').forEach(s => {
      s.status = action === 'approve' ? 'skipped' : 'rejected';
      s.comment = 'Admin override';
      s.actionDate = new Date();
    });

    await expense.save();
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { approveExpense, rejectExpense, overrideApproval };
