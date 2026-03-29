const Expense = require('../models/Expense');

exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    expense.status = 'approved';
    expense.approvedBy = req.user.id;
    expense.approvedAt = new Date();
    expense.comments = req.body.comments || '';
    await expense.save();
    res.json({ success: true, message: 'Expense approved', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    expense.status = 'rejected';
    expense.approvedBy = req.user.id;
    expense.approvedAt = new Date();
    expense.comments = req.body.comments || '';
    await expense.save();
    res.json({ success: true, message: 'Expense rejected', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.overrideApproval = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    expense.status = req.body.status || 'approved';
    expense.approvedBy = req.user.id;
    expense.approvedAt = new Date();
    expense.comments = req.body.comments || 'Admin override';
    await expense.save();
    res.json({ success: true, message: 'Approval overridden', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
