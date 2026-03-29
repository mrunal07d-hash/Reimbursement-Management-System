const fetch = require('node-fetch');

exports.getExchangeRates = async (req, res) => {
  try {
    const { base } = req.query;
    const baseCurrency = base || 'INR';

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    const data = await response.json();

    res.json({
      success: true,
      base: baseCurrency,
      rates: data.rates
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.convertCurrency = async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    const data = await response.json();

    const rate = data.rates[to];
    if (!rate) {
      return res.status(400).json({ success: false, message: 'Invalid currency code' });
    }

    const converted = (amount * rate).toFixed(2);
    res.json({
      success: true,
      amount, from, to, rate,
      converted: parseFloat(converted)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
