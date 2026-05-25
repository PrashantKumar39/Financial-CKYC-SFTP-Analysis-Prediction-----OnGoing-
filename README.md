# 🔐 CKYC SFTP Failure Analysis & Prediction

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-ML_Model-FF6600?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![scikit-learn](https://img.shields.io/badge/Scikit--learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-Dashboard-FF6384?style=for-the-badge)

**End-to-end ML system to detect, analyse, and predict SFTP connection failures in India's CKYC compliance infrastructure.**

</div>

---

## 📌 Overview

India's **Central KYC (CKYC)** registry, managed by CERSAI, is the backbone of financial customer onboarding. Banks and NBFCs connect to it via SFTP to upload and download KYC records. A failure in this connection means institutions cannot onboard customers — a direct **regulatory violation** with penalty risk.

This project analyses **68,177 real SFTP connection logs** over 30 days across 5 institutional users, root-causes a **6-day near-total blackout**, and deploys a live **XGBoost failure predictor** behind a full-stack web dashboard.

---

## 🖼️ Screenshots

### 🏠 Hero — Overview
> The landing section shows live KPIs pulled from the backend API including total logs, failure rate, crisis duration, and the active ML model.

![Hero Section](screenshots/hero.png)

---

### 📊 Live Analytics Dashboard
> Interactive charts showing daily failure rate vs request volume, failures per user, error type distribution (doughnut), and failure rate by operation type. The crisis window (Feb 14–19) is highlighted.

![Dashboard](screenshots/dashboard.png)

---

### 🤖 Failure Predictor — SUCCESS result
> User sets operation type, user ID, hour of day, elapsed seconds, week number, and context flags. The model returns a failure probability ring, verdict badge, and risk level chip.

![Prediction Success](screenshots/predict_success.png)

---

### 🤖 Failure Predictor — FAIL result
> Same predictor showing a HIGH risk scenario — 88.6% failure probability for a Rename operation by User 4 at 19:00.

![Prediction Fail](screenshots/predict_fail.png)

---

### 📄 About This Work
> Project summary cards covering the Problem, Approach, Model, and Impact — plus the full tech stack used.

![About Section](screenshots/about.png)

---

## 🚨 The Problem

| Metric | Value |
|--------|-------|
| Total Logs Analysed | 68,177 |
| Overall Failure Rate | **62.1%** |
| Crisis Window | **Feb 14 – Feb 19 (6 days)** |
| Peak Failure Rate | **98%** during crisis |
| Retry Storm Rate | **41.3%** |
| Root Cause | `PermissionDenied` on government SFTP server |
| Users Affected | 5 institutional customers |

No early warning system existed. Regulatory penalties were a real risk.

---

## 🔍 Approach

### Data & EDA
- 10 exploratory data analysis passes on raw log data
- Phase labeling: **Pre-crisis → Crisis → Recovery → Normal**
- Feature engineering:
  - Burst count (retry storm detection)
  - Rolling failure rate
  - Elapsed seconds log-transform
  - Hour of day, week number, weekend flag
  - Is-critical-operation flag

### ML Pipeline
- **Chronological 80/10/10 split** (correct for time-series — no data leakage)
- **SMOTE** applied on training set only to handle class imbalance
- Leaky features explicitly identified and removed
- Gaussian noise added for generalisation

### Model Comparison

| Model | Notes |
|-------|-------|
| Logistic Regression | Baseline |
| Decision Tree | Overfitting risk |
| Random Forest | Strong but slower |
| **XGBoost** ✅ | **Best performer — selected** |

### Root Cause Isolation
The crisis was traced to a **server-side `PermissionDenied` error** on the CKYC government SFTP server — confirmed not a network issue, not a client misconfiguration. This distinction matters for incident response escalation.

---

## 🧠 Model Features (8 total)

| Feature | Description |
|---------|-------------|
| `elapsed_seconds` | Raw transfer duration |
| `elapsed_log` | Log-transformed elapsed time |
| `hour` | Hour of day (0–23) |
| `week_number` | Calendar week |
| `is_weekend` | Weekend flag (0/1) |
| `operation_enc` | Label-encoded operation type |
| `user_enc` | Label-encoded user ID |
| `is_critical_op` | Upload or bulk_download flag |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│              Frontend (HTML/CSS/JS)       │
│  particles.js · Chart.js · Custom UI     │
└────────────────┬─────────────────────────┘
                 │ fetch() REST calls
┌────────────────▼─────────────────────────┐
│         Node.js / Express Backend        │
│  /health   /stats   /predict             │
└────────────────┬─────────────────────────┘
                 │ spawns subprocess
┌────────────────▼─────────────────────────┐
│           predict.py (Python)            │
│  loads model.pkl · scaler.pkl            │
│  le_op.pkl · le_user.pkl                 │
│  → returns JSON prediction               │
└──────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
├── CFrontend/
│   ├── index.html          # Main UI (all sections)
│   ├── style.css           # Dark theme, animations
│   ├── app.js              # Charts, prediction, nav logic
│   └── particles-config.js # Background particle config
│
├── CBackend/
│   ├── server.js           # Express server (health/stats/predict)
│   ├── predict.py          # ML inference script
│   ├── model.pkl           # Trained XGBoost model
│   ├── scaler.pkl          # StandardScaler
│   ├── le_op.pkl           # LabelEncoder for operations
│   ├── le_user.pkl         # LabelEncoder for users
│   ├── requirements.txt    # Python dependencies
│   └── package.json        # Node dependencies
│
└── CKYC_SFTP_Connection_Log___Failure_Analysis___Prediction.ipynb
```

---

## ⚙️ Setup & Run

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install Python dependencies
```bash
pip install -r CBackend/requirements.txt
```

### 3. Install Node dependencies
```bash
cd CBackend
npm install
```

### 4. Start the backend server
```bash
node server.js
```
> Server runs at `http://localhost:5001`

### 5. Open the frontend
Open `CFrontend/index.html` in your browser — or serve it:
```bash
npx serve CFrontend
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check if backend + Python are running |
| `/stats` | GET | Return dashboard summary, chart data |
| `/predict` | POST | Run XGBoost inference, return prediction |

### `/predict` — Request Body
```json
{
  "operation": "upload",
  "user_id": "user1",
  "hour": 14,
  "elapsed_seconds": 30,
  "week_number": 7,
  "is_weekend": 0,
  "is_critical_op": 1
}
```

### `/predict` — Response
```json
{
  "prediction": "FAIL",
  "failure_probability": 88.6,
  "success_probability": 11.4,
  "risk_level": "HIGH",
  "inputs_used": { ... }
}
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| ML Model | XGBoost, Scikit-learn, SMOTE (imbalanced-learn) |
| Data Processing | Python, Pandas, NumPy |
| Model Serving | Python (joblib), Node.js subprocess |
| Backend API | Node.js, Express |
| Frontend | HTML5, CSS3, Vanilla JS |
| Charts | Chart.js |
| Background FX | particles.js |
| Fonts | DM Sans, IBM Plex Mono, Syne |

---

## 📈 Key Findings

- **PermissionDenied** accounted for ~66% of all errors — server-side, not client
- **Upload** and **bulk_download** had the highest failure rates (64.8%, 64.1%)
- All 5 users were equally affected — ruling out user-specific misconfiguration
- **Retry storms** hit 41.3% — failed connections triggering cascading retries
- Post-crisis recovery took 3 days (Feb 20–22) before returning to ~12% baseline

---

## 🎯 Impact

- ✅ Predictive failure detection before transfers begin
- ✅ Retry storm quantification and early warning
- ✅ Server-side root cause isolated (vs. network/client)
- ✅ Reusable behavioral feature library for any SFTP compliance stack
- ✅ Live interactive dashboard for ongoing monitoring

---

## 📓 Notebook

The full analysis is in:
```
CKYC_SFTP_Connection_Log___Failure_Analysis___Prediction.ipynb
```
Covers: data loading → EDA (10 analyses) → feature engineering → model training → evaluation → deployment prep.

---

## 👤 Author

**[Your Name]**
- GitHub: [@your_username](https://github.com/your_username)
- LinkedIn: [your-linkedin](https://linkedin.com/in/your-linkedin)

---

<div align="center">
<sub>Built with Python · XGBoost · Node.js · Chart.js</sub>
</div>
