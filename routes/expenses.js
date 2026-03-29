const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getMyExpenses
} = require('../controllers/expenseController');

router.get('/', protect, authorize('admin', 'manager'), getAllExpenses);
router.get('/my', protect, getMyExpenses);
router.get('/:id', protect, getExpenseById);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;
