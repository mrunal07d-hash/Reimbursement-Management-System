const express = require('express');
const router = express.Router();
const { getCountriesAndCurrencies, convertCurrency } = require('../controllers/currencyController');

router.get('/all', getCountriesAndCurrencies);
router.get('/convert', convertCurrency);

module.exports = router;
