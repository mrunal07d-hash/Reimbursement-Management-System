# 💸 ReimburseFlow — Expense Reimbursement Management

A full-stack web application for managing employee expense reimbursements with multi-level approval workflows, OCR receipt scanning, and real-time currency conversion.

---

## 🚀 Features

### Authentication & User Management
- Company + Admin auto-created on signup
- Admin can create Employees & Managers, assign roles, define manager relationships
- JWT-based authentication with role-based access control

### Expense Submission
- Submit claims with Amount (any currency), Category, Description, Date
- Live currency conversion via [exchangerate-api.com](https://api.exchangerate-api.com)
- Drag-and-drop receipt upload with **OCR auto-fill** (Tesseract.js)
- Itemized expense lines

### Approval Workflow
- Multi-step sequential approvals (Manager → Finance → Director)
- Manager-first routing when `isManagerApprover` is enabled
- Approve/Reject with comments
- Admin override capability

### Conditional Approval Rules
- **Percentage rule**: 60% of approvers approve → auto-approved
- **Specific approver rule**: CFO approves → auto-approved
- **Hybrid**: 60% OR CFO approves
- Amount thresholds and category filters per rule

### Role Permissions
| Role | Capabilities |
|------|-------------|
| **Admin** | Full access: manage users, rules, override approvals, view all expenses |
| **Manager** | Approve/reject team expenses, view team expenses |
| **Employee** | Submit expenses, view own history and approval status |

---

## 🛠 Tech Stack

**Backend**: Node.js · Express · MongoDB (Mongoose) · JWT · Tesseract.js (OCR) · Multer  
**Frontend**: React 18 · React Router v6 · Axios · Recharts · React Dropzone · React Hot Toast

---

## 📁 Project Structure

```
reimbursement-app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Mongoose schemas
│   │   └── routes/          # API routes
│   ├── uploads/             # Receipt files (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── utils/           # Helpers & constants
│   └── package.json
├── render.yaml              # Render deployment config
└── .gitignore
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/reimbursement-app.git
cd reimbursement-app

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/reimbursement
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

Visit: **http://localhost:3000**

---

## 🌐 Deploy to Render

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: ReimburseFlow"
git remote add origin https://github.com/YOUR_USERNAME/reimbursement-app.git
git push -u origin main
```

### Step 2: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Add database user and whitelist `0.0.0.0/0` (all IPs)
4. Copy your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/reimbursement`

### Step 3: Deploy on Render

**Option A — Blueprint (auto-deploys both services):**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New → Blueprint**
3. Connect your GitHub repo
4. Render detects `render.yaml` and creates both services
5. Add environment variable `MONGODB_URI` manually in backend service settings

**Option B — Manual:**

**Backend:**
1. New → Web Service → Connect repo
2. Root Directory: `backend`
3. Build: `npm install`
4. Start: `npm start`
5. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`

**Frontend:**
1. New → Static Site → Connect repo
2. Root Directory: `frontend`
3. Build: `npm install && npm run build`
4. Publish: `./build`
5. Add env var: `REACT_APP_API_URL` = your backend Render URL
6. Add redirect rule: `/* → /index.html` (200)

---

## 🔑 First Login

1. Visit your deployed URL
2. Click **Create Account**
3. Fill in your name, company name, country, and currency
4. You'll be logged in as **Admin**
5. Go to **Users** to create employees and managers
6. Go to **Approval Rules** to configure your workflow

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register company + admin |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users` | List users (admin/manager) |
| POST | `/api/users` | Create user (admin) |
| POST | `/api/expenses` | Submit expense |
| GET | `/api/expenses/my` | My expenses |
| GET | `/api/expenses/all` | All expenses (admin) |
| GET | `/api/expenses/pending-approvals` | Pending approvals |
| POST | `/api/approvals/:id/approve` | Approve expense |
| POST | `/api/approvals/:id/reject` | Reject expense |
| POST | `/api/approvals/:id/override` | Admin override |
| GET | `/api/company/rules` | Get approval rules |
| POST | `/api/company/rules` | Create approval rule |
| GET | `/api/currency/all` | All currencies |
| GET | `/api/currency/convert` | Convert currency |
| POST | `/api/expenses/upload-receipt` | Upload + OCR receipt |

---

## 🐛 Troubleshooting

**CORS errors**: Ensure `FRONTEND_URL` in backend env matches your frontend URL exactly  
**MongoDB connection**: Whitelist Render's IPs in Atlas (or use `0.0.0.0/0`)  
**OCR not working**: Tesseract.js requires the receipt image to be clear and readable  
**Currency conversion fails**: The free exchangerate-api tier has rate limits; falls back gracefully
