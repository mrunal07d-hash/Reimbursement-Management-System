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
