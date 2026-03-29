const express = require('express');

const router = express.Router();

const {

  getCompany, updateCompany, getApprovalRules,

  createApprovalRule, updateApprovalRule, deleteApprovalRule

} = require('../controllers/companyController');

const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCompany);

router.put('/', authorize('admin'), updateCompany);

router.get('/rules', getApprovalRules);

router.post('/rules', authorize('admin'), createApprovalRule);

router.put('/rules/:ruleId', authorize('admin'), updateApprovalRule);

router.delete('/rules/:ruleId', authorize('admin'), deleteApprovalRule);

module.exports = router; 
