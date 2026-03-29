const fetch = require('node-fetch');

const getCountriesAndCurrencies = async (req, res) => {

  try {

    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');

    const data = await response.json();

    const currencies = [];

    const seen = new Set();

    data.forEach(country => {

      if (country.currencies) {

        Object.entries(country.currencies).forEach(([code, info]) => {

          if (!seen.has(code)) {

            seen.add(code);

            currencies.push({ code, name: info.name, symbol: info.symbol || code });

          }

        });

      }

    });

    currencies.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, currencies });

  } catch (err) {

    res.status(500).json({ success: false, message: 'Failed to fetch currencies', currencies: [

      { code: 'USD', name: 'US Dollar', symbol: '$' },

      { code: 'EUR', name: 'Euro', symbol: '€' },

      { code: 'GBP', name: 'British Pound', symbol: '£' },

      { code: 'INR', name: 'Indian Rupee', symbol: '₹' }

    ]});

  }

};

const convertCurrency = async (req, res) => {

  try {

    const { from, to, amount } = req.query;

    if (from === to) return res.json({ success: true, rate: 1, converted: parseFloat(amount) });

    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);

    const data = await response.json();

    const rate = data.rates?.[to] || 1;

    const converted = parseFloat(amount) * rate;

    res.json({ success: true, rate, converted, from, to });

  } catch (err) {

    res.status(500).json({ success: false, message: 'Conversion failed' });

  }

};

module.exports = { getCountriesAndCurrencies, convertCurrency };
