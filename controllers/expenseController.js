
at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/opt/render/project/src/server.js:7:20)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/opt/render/project/src/server.js' ]
}
Node.js v22.22.0
==> Exited with status 1

Show less
9:43 AM
This is a MODULE_NOT_FOUND error — Node can't find a module you're requiring in server.js at line 7. A few likely causes:

1. Missing node_modules (most common on Render)

Your package.json lists a dependency that didn't get installed. Check that:

Your Build Command on Render is npm install (or npm ci)
The failing package is listed under "dependencies" in package.json, not "devDependencies"
2. Wrong root directory

If your server.js is inside a subfolder (like src/ or backend/), make sure Render's Root Directory is set correctly so it finds your package.json.

3. Typo in the require path

Look at line 7 of your server.js. If it's a local file import like:

js
const something = require('./utils/helper');
double-check the path and filename casing — Linux (Render's OS) is case-sensitive, unlike Windows.

Quick fix steps:

Share what's on line 7 of server.js — that'll pinpoint exactly which module is missing
Also share your package.json "dependencies" section
That'll let me tell you exactly what's wrong!

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const approvalRoutes = require('./routes/approvals');
const companyRoutes = require('./routes/company');
const currencyRoutes = require('./routes/currency');
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/currency', currencyRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reimbursement';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(Server running on port ${PORT}));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
module.exports = app;.  this full code of this file

Show more
9:48 AM
The error is on line 7: require('./routes/auth') — one of your route files is missing or the path is wrong.

Most likely causes:

The routes/ folder wasn't pushed to GitHub — this is the #1 cause on Render. Empty folders and untracked files don't get committed.
Wrong Root Directory on Render — if your server.js is inside a backend/ folder, Render needs to know that.
Step 1 — Check your repo structure

Go to your GitHub repo and confirm this structure exists:

backend/          (or wherever server.js lives)
├── server.js
├── package.json
└── routes/
    ├── auth.js
    ├── users.js
    ├── expenses.js
    ├── approvals.js
    ├── company.js
    └── currency.js
If the routes/ folder is missing on GitHub, that's your problem.

Step 2 — Push the routes folder

On your laptop, run:

bash
git add routes/
git commit -m "add routes folder"
git push
Step 3 — Verify Render settings

In your Render service dashboard:

Root Directory → set to backend (or wherever your package.json is)
Build Command → npm install
Start Command → node server.js
Share this if you're still stuck: run git status and paste the output — it'll show exactly which files are untracked or missing from your repo.

so give me full upaded code of serve.is file

9:49 AM
Your server.js looks completely fine as-is — the issue isn't in this file, it's that the routes/ files are missing from your GitHub repo.

Rewriting server.js won't fix the error. What you need to do is:

Check if routes/ folder exists on GitHub — go to your repo and look
If it's missing, push it:
bash
git add .
git commit -m "add routes and all missing files"
git push
That said, here's your server.js cleaned up with one small improvement (a catch for unhandled routes), but again — this is not what's causing your error:

js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const approvalRoutes = require('./routes/approvals');
const companyRoutes = require('./routes/company');
const currencyRoutes = require('./routes/currency');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/currency', currencyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reimbursement';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
Now tell me — when you go to your GitHub repo, do you see a routes/ folder there?

Check if routes/ folder exists on GitHub — go to your repo and look
If it's missing, push it:.   how do this
9:51 AM
Here's exactly how to do it, step by step:

Step 1 — Check GitHub first

Go to your repo on github.com and look if a routes/ folder is visible there. If yes, skip to Render settings. If no, continue below.

Step 2 — Open terminal in your project folder

On your laptop, open terminal/command prompt and navigate to your project:

bash
cd path/to/your/project
For example:

bash
cd Desktop/my-expense-app
Step 3 — Check what's missing

bash
git status
This shows all untracked/missing files. You should see your routes/ folder listed in red.

Step 4 — Add everything and push

bash
git add .
git commit -m "add routes and missing files"
git push
Step 5 — Verify on GitHub

Refresh your GitHub repo page — you should now see the routes/ folder appear.

Step 6 — Redeploy on Render

Render auto-deploys when you push, so it should trigger automatically. Watch the deploy logs — it should now pass the MODULE_NOT_FOUND error.

If you get an error during git push, paste it here and I'll help. Also tell me:

Are you on Windows or Mac?
Is this a new project or one you've been working on for a while?
we add it manually

9:57 AM
Got it! Here's how to manually add files on GitHub:

Step 1 — Go to your repo on GitHub

Open your repo in the browser.

Step 2 — Create the routes folder

GitHub doesn't let you create empty folders, so you create a file inside it:

Click "Add file" → "Create new file"
In the filename box, type:
routes/auth.js
(Typing the / automatically creates the folder)

Paste your auth.js code in the editor
Click "Commit changes"
Step 3 — Repeat for each route file

Do the same for:

routes/users.js
routes/expenses.js
routes/approvals.js
routes/company.js
routes/currency.js
But wait — do you actually have the code for these route files written already on your laptop?

If yes → paste each one here and I'll help you add them one by one
If no → tell me what your app does (expense reimbursement system it looks like) and I'll generate all 6 route files for you completely
auth.js

10:00 AM
Share the code for your auth.js file (or tell me what features it needs) and I'll help you with it!

If you don't have it written yet, just tell me:

What auth features do you need? (e.g. register, login, logout, forgot password, JWT tokens?)
What's your User model like? (fields like name, email, password, role, company?)
I'll generate the complete auth.js route file for you.

==> Downloading cache...
==> It looks like we don't have access to your repo, but we'll try to clone it anyway.
==> Cloning from https://github.com/mrunal07d-hash/Reimbursement-Management-System
==> Checking out commit 32ca5f77b73d72d8c8a211bda3ea5e5cbdfad551 in branch main
==> Downloaded 92MB in 7s. Extraction took 2s.
==> Using Node.js version 22.22.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
up to date, audited 167 packages in 508ms
25 packages are looking for funding
  run npm fund for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 3.4s. Compression took 1.4s
Menu
==> Build successful 🎉
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
==> Running 'node server.js'
node:internal/modules/cjs/loader:1386
  throw err;
  ^
Error: Cannot find module '../controllers/authController'
Require stack:
- /opt/render/project/src/routes/auth.js
- /opt/render/project/src/server.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/opt/render/project/src/routes/auth.js:5:65)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/routes/auth.js',
    '/opt/render/project/src/server.js'
  ]
}
Node.js v22.22.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys

Show more
10:18 AM
Good progress! routes/ folder is now found. Now it's the same problem one level deeper —controllers/ folder is missing from GitHub.

Your auth.js route file is trying to do:

js
require('../controllers/authController')
But that file isn't on GitHub.

You need to add these folders/files to GitHub manually the same way:

Based on your routes, you'll likely need:

controllers/authController.js
controllers/userController.js
controllers/expenseController.js
controllers/approvalController.js
controllers/companyController.js
controllers/currencyController.js
Do you have these controller files written on your laptop?

If yes → paste them here one by one and I'll help you add them to GitHub
If no → share your route files (auth.js, users.js, etc.) and I'll generate matching controller files for you
Also, check your full project folder structure on your laptop and tell me all the folders you have — like models/, middleware/, config/ etc. — so we can push everything at once and avoid this error repeating for each missing folder.




const Expense = require('../models/Expense'); const Company = require('../models/Company'); const User = require('../models/User'); const fetch = require('node-fetch'); const buildApprovalSteps = async (expense, company, submitter) => { const steps = []; const defaultRule = company.appro

pasted



const Expense = require('../models/Expense'); const Company = require('../models/Company'); const checkConditionalApproval = (expense, company) => { const rule = company.approvalRules?.find(r => r._id.toString() === expense.approvalRule?.toString()); if (!rule || !rule.conditions) return n

pasted


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





















Claude is AI and can make mistakes. Please double-check responses.

Pasted content
7.63 KB •235 lines
•
Formatting may be inconsistent from source

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
