const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  approveExpense,
  rejectExpense,
  overrideApproval
} = require('../controllers/approvalController');

router.post('/:id/approve', protect, authorize('admin', 'manager'), approveExpense);
router.post('/:id/reject', protect, authorize('admin', 'manager'), rejectExpense);
router.post('/:id/override', protect, authorize('admin'), overrideApproval);

module.exports = router;
