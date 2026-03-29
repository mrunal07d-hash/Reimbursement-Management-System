const express = require('express');

const router = express.Router();

const { getUsers, createUser, updateUser, deleteUser, getManagers } = require('../controllers/userController');

const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('admin', 'manager'), getUsers);

router.post('/', authorize('admin'), createUser);

router.put('/:id', authorize('admin'), updateUser);

router.delete('/:id', authorize('admin'), deleteUser);

router.get('/managers/list', getManagers);

module.exports = router;  
