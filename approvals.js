const express = require('express');
const router = express.Router();
const { approveExpense, rejectExpense, overrideApproval } = require('../controllers/approvalController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.post('/:id/approve', authorize('admin', 'manager'), approveExpense);
router.post('/:id/reject', authorize('admin', 'manager'), rejectExpense);
router.post('/:id/override', authorize('admin'), overrideApproval);

module.exports = router;
