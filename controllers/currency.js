const axios = require('axios');

exports.getExchangeRates = async (req, res) => {
  try {
    const { base } = req.query;
    const baseCurrency = base || 'INR';
    
    // Using free exchangerate API
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    
    res.json({
      success: true,
      base: baseCurrency,
      rates: response.data.rates
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.convertCurrency = async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    
    const rate = response.data.rates[to];
    if (!rate) {
      return res.status(400).json({ success: false, message: 'Invalid currency code' });
    }
    
    const converted = (amount * rate).toFixed(2);
    res.json({ success: true, amount, from, to, rate, converted: parseFloat(converted) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
