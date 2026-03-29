const express = require('express');
const router = express.Router();
const {
  submitExpense, getMyExpenses, getAllExpenses, getTeamExpenses,
  getExpenseById, updateExpense, getPendingApprovals, getDashboardStats
} = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/dashboard', getDashboardStats);
router.get('/my', getMyExpenses);
router.get('/pending-approvals', getPendingApprovals);
router.get('/all', authorize('admin'), getAllExpenses);
router.get('/team', authorize('admin', 'manager'), getTeamExpenses);
router.post('/', submitExpense);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);

router.post('/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    let ocrData = null;
    try {
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
      
      const amountMatch = text.match(/(?:total|amount|subtotal)[:\s]*[$£€₹]?\s*([\d,]+\.?\d*)/i);
      const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
      
      ocrData = {
        rawText: text.substring(0, 500),
        amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null,
        date: dateMatch ? dateMatch[0] : null,
        vendor: text.split('\n')[0]?.trim().substring(0, 50) || null
      };
    } catch (ocrErr) {
      console.log('OCR failed:', ocrErr.message);
    }

    res.json({
      success: true,
      file: {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.originalname
      },
      ocrData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
