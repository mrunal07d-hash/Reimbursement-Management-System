const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTeamMembers
} = require('../controllers/userController');

router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/team', protect, authorize('manager', 'admin'), getTeamMembers);
router.get('/:id', protect, getUserById);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
