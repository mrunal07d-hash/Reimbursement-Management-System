const mongoose = require('mongoose');

const expenseLineSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String
});

const approvalStepSchema = new mongoose.Schema({
  stepOrder: Number,
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approverRole: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'skipped'], default: 'pending' },
  comment: String,
  actionDate: Date,
  label: String
});

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  currency: {
    code: { type: String, required: true },
    symbol: String,
    name: String
  },
  amountInCompanyCurrency: Number,
  exchangeRate: Number,
  category: {
    type: String,
    enum: ['travel', 'meals', 'accommodation', 'office_supplies', 'software', 'training', 'medical', 'entertainment', 'utilities', 'other'],
    required: true
  },
  date: { type: Date, required: true },
  receipt: {
    url: String,
    filename: String,
    ocrData: {
      vendor: String,
      amount: Number,
      date: String,
      description: String,
      items: [expenseLineSchema]
    }
  },
  expenseLines: [expenseLineSchema],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled'],
    default: 'submitted'
  },
  approvalRule: { type: mongoose.Schema.Types.ObjectId },
  approvalSteps: [approvalStepSchema],
  currentStep: { type: Number, default: 0 },
  finalComment: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

expenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
