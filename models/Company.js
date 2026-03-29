const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({

  name: { type: String, required: true },

  description: String,

  type: { type: String, enum: ['sequential', 'conditional', 'hybrid'], default: 'sequential' },

  steps: [{

    order: Number,

    approverType: { type: String, enum: ['user', 'role', 'manager'] },

    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    approverRole: String,

    isManagerApprover: { type: Boolean, default: false },

    label: String

  }],

  conditions: {

    percentageApproval: Number,

    specificApproverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    conditionType: { type: String, enum: ['percentage', 'specific', 'hybrid'] }

  },

  amountThreshold: {

    min: Number,

    max: Number

  },

  categories: [String],

  isDefault: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true }

});

const companySchema = new mongoose.Schema({

  name: { type: String, required: true },

  country: { type: String, required: true },

  currency: {

    code: { type: String, required: true },

    name: String,

    symbol: String

  },

  approvalRules: [approvalRuleSchema],

  settings: {

    requireReceipt: { type: Boolean, default: false },

    maxExpenseAmount: Number,

    autoApproveBelow: Number

  },

  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Company', companySchema);
