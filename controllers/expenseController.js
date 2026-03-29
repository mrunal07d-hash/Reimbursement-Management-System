const Expense = require('../models/Expense');

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ company: req.user.company })
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ submittedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { title, amount, currency, category, description, date, receipt } = req.body;
    const expense = await Expense.create({
      title, amount, currency, category, description, date, receipt,
      submittedBy: req.user.id,
      company: req.user.company
    });
    res.status(201).json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot edit a processed expense' });
    }
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    res.json({ success: true, expense: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
