const Company = require('../models/Company');

const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id);
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { name, settings } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.user.company._id,
      { name, settings },
      { new: true }
    );
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getApprovalRules = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id).populate('approvalRules.steps.approverId', 'name email role');
    res.json({ success: true, rules: company.approvalRules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createApprovalRule = async (req, res) => {
  try {
    const { name, description, type, steps, conditions, amountThreshold, categories, isDefault } = req.body;
    const company = await Company.findById(req.user.company._id);

    if (isDefault) {
      company.approvalRules.forEach(r => r.isDefault = false);
    }

    company.approvalRules.push({ name, description, type, steps, conditions, amountThreshold, categories, isDefault, isActive: true });
    await company.save();

    res.json({ success: true, rules: company.approvalRules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateApprovalRule = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id);
    const rule = company.approvalRules.id(req.params.ruleId);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

    if (req.body.isDefault) company.approvalRules.forEach(r => r.isDefault = false);
    Object.assign(rule, req.body);
    await company.save();

    res.json({ success: true, rules: company.approvalRules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteApprovalRule = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id);
    company.approvalRules = company.approvalRules.filter(r => r._id.toString() !== req.params.ruleId);
    await company.save();
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCompany, updateCompany, getApprovalRules, createApprovalRule, updateApprovalRule, deleteApprovalRule };
