const Expense = require('../models/Expense');
const Company = require('../models/Company');
const User = require('../models/User');
const fetch = require('node-fetch');

const buildApprovalSteps = async (expense, company, submitter) => {
  const steps = [];
  const defaultRule = company.approvalRules?.find(r => r.isDefault && r.isActive);
  if (!defaultRule || defaultRule.steps.length === 0) return { steps: [], ruleId: null };

  for (const step of defaultRule.steps) {
    let approverId = step.approverId;

    if (step.isManagerApprover && submitter.manager) {
      approverId = submitter.manager;
    }

    if (approverId) {
      steps.push({
        stepOrder: step.order,
        approver: approverId,
        approverRole: step.approverRole || step.label,
        status: 'pending',
        label: step.label
      });
    }
  }

  return { steps, ruleId: defaultRule._id };
};

const getExchangeRate = async (from, to) => {
  try {
    if (from === to) return 1;
    const resp = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await resp.json();
    return data.rates?.[to] || 1;
  } catch {
    return 1;
  }
};

const submitExpense = async (req, res) => {
  try {
    const { title, description, amount, currency, category, date, expenseLines, receipt, tags } = req.body;
    const company = await Company.findById(req.user.company._id);
    const submitter = await User.findById(req.user._id).populate('manager');

    const exchangeRate = await getExchangeRate(currency.code, company.currency.code);
    const amountInCompanyCurrency = amount * exchangeRate;

    const { steps, ruleId } = await buildApprovalSteps({}, company, submitter);

    const expense = await Expense.create({
      title,
      description,
      amount,
      currency,
      amountInCompanyCurrency,
      exchangeRate,
      category,
      date,
      expenseLines: expenseLines || [],
      receipt,
      tags,
      submittedBy: req.user._id,
      company: company._id,
      status: steps.length > 0 ? 'in_review' : 'approved',
      approvalRule: ruleId,
      approvalSteps: steps,
      currentStep: 0
    });

    const populated = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('approvalSteps.approver', 'name email role');

    res.status(201).json({ success: true, expense: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyExpenses = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { submittedBy: req.user._id };
    if (status) query.status = status;

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email')
      .populate('approvalSteps.approver', 'name email role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);
    res.json({ success: true, expenses, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    const query = { company: req.user.company._id };
    if (status) query.status = status;
    if (userId) query.submittedBy = userId;

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email department')
      .populate('approvalSteps.approver', 'name email role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);
    res.json({ success: true, expenses, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTeamExpenses = async (req, res) => {
  try {
    const teamMembers = await User.find({ manager: req.user._id, company: req.user.company._id }).select('_id');
    const ids = teamMembers.map(m => m._id);

    const { status } = req.query;
    const query = { submittedBy: { $in: ids }, company: req.user.company._id };
    if (status) query.status = status;

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email department')
      .populate('approvalSteps.approver', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name email department')
      .populate('approvalSteps.approver', 'name email role');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, submittedBy: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.status !== 'submitted') return res.status(400).json({ success: false, message: 'Cannot edit expense in current status' });

    Object.assign(expense, req.body);
    await expense.save();
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const expenses = await Expense.find({
      company: req.user.company._id,
      status: 'in_review',
      approvalSteps: {
        $elemMatch: {
          approver: req.user._id,
          status: 'pending'
        }
      }
    })
      .populate('submittedBy', 'name email department')
      .populate('approvalSteps.approver', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.company._id;
    const isAdmin = req.user.role === 'admin';
    const baseQuery = isAdmin ? { company: companyId } : { submittedBy: req.user._id };

    const [total, pending, approved, rejected, totalAmount] = await Promise.all([
      Expense.countDocuments(baseQuery),
      Expense.countDocuments({ ...baseQuery, status: 'in_review' }),
      Expense.countDocuments({ ...baseQuery, status: 'approved' }),
      Expense.countDocuments({ ...baseQuery, status: 'rejected' }),
      Expense.aggregate([
        { $match: { ...baseQuery, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amountInCompanyCurrency' } } }
      ])
    ]);

    const recentExpenses = await Expense.find(baseQuery)
      .populate('submittedBy', 'name email')
      .sort('-createdAt')
      .limit(5);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        totalApprovedAmount: totalAmount[0]?.total || 0
      },
      recentExpenses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  submitExpense, getMyExpenses, getAllExpenses, getTeamExpenses,
  getExpenseById, updateExpense, getPendingApprovals, getDashboardStats
};
