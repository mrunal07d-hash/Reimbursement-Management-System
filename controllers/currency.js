const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getExchangeRates,
  convertCurrency
} = require('../controllers/currencyController');

router.get('/rates', protect, getExchangeRates);
router.post('/convert', protect, convertCurrency);

module.exports = router;
