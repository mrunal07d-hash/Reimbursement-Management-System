const User = require('../models/User');
const Company = require('../models/Company');

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = { company: req.user.company._id };
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const users = await User.find(query).populate('manager', 'name email role').sort('name');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId, department, position, isManagerApprover } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password: password || 'Password@123',
      role: role || 'employee',
      company: req.user.company._id,
      manager: managerId || null,
      department,
      position,
      isManagerApprover: isManagerApprover || false
    });

    const populated = await User.findById(user._id).populate('manager', 'name email');
    res.status(201).json({ success: true, user: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, managerId, department, position, isActive, isManagerApprover } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company._id },
      { name, role, manager: managerId || null, department, position, isActive, isManagerApprover },
      { new: true }
    ).populate('manager', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    await User.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company._id },
      { isActive: false }
    );
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getManagers = async (req, res) => {
  try {
    const managers = await User.find({
      company: req.user.company._id,
      role: { $in: ['manager', 'admin'] },
      isActive: true
    }).select('name email role');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getManagers };
