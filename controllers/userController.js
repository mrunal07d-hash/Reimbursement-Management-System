const jwt = require('jsonwebtoken');

const User = require('../models/User');

const Company = require('../models/Company');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {

  expiresIn: process.env.JWT_EXPIRES_IN || '7d'

});

const signup = async (req, res) => {

  try {

    const { name, email, password, companyName, country, currency } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const company = await Company.create({

      name: companyName || `${name}'s Company`,

      country: country || 'United States',

      currency: {

        code: currency?.code || 'USD',

        name: currency?.name || 'US Dollar',

        symbol: currency?.symbol || '$'

      },

      approvalRules: [{

        name: 'Default Approval',

        type: 'sequential',

        steps: [],

        isDefault: true,

        isActive: true

      }]

    });

    const user = await User.create({

      name,

      email,

      password,

      role: 'admin',

      company: company._id

    });

    const token = generateToken(user._id);

    const populatedUser = await User.findById(user._id).populate('company');

    res.status(201).json({ success: true, token, user: populatedUser });

  } catch (err) {

    console.error('Signup error:', err);

    res.status(500).json({ success: false, message: err.message });

  }

};

const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('company').populate('manager', 'name email');

    if (!user || !await user.comparePassword(password)) {

      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    }

    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    user.lastLogin = new Date();

    await user.save();

    const token = generateToken(user._id);

    res.json({ success: true, token, user });

  } catch (err) {

    res.status(500).json({ success: false, message: err.message });

  }

};

const getMe = async (req, res) => {

  res.json({ success: true, user: req.user });

};

const updateProfile = async (req, res) => {

  try {

    const { name, department, position } = req.body;

    const user = await User.findByIdAndUpdate(req.user._id, { name, department, position }, { new: true }).populate('company');

    res.json({ success: true, user });

  } catch (err) {

    res.status(500).json({ success: false, message: err.message });

  }

};

const changePassword = async (req, res) => {

  try {

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!await user.comparePassword(currentPassword)) {

      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    }

    user.password = newPassword;

    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (err) {

    res.status(500).json({ success: false, message: err.message });

  }

};

module.exports = { signup, login, getMe, updateProfile, changePassword };

( for authcontroller.js ) 











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
