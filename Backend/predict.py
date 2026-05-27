import warnings
warnings.filterwarnings("ignore")

import sys
import json
import os
import joblib
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))

def load(filename):
    return joblib.load(os.path.join(BASE, filename))

# ── Load all 4 model files ────────────────────────────────
try:
    model   = load("model.pkl")
    scaler  = load("scaler.pkl")
    le_op   = load("le_op.pkl")
    le_user = load("le_user.pkl")
except FileNotFoundError as e:
    print(json.dumps({"error": f"Missing file: {str(e)}"}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

# ── Read input JSON from command line argument ────────────
try:
    data = json.loads(sys.argv[1])

    # encode operation
    raw_op = data.get("operation", "upload")
    if raw_op in le_op.classes_:
        op_enc = int(le_op.transform([raw_op])[0])
    else:
        op_enc = 0

    # encode user
    raw_user = data.get("user_id", "user1")
    if raw_user in le_user.classes_:
        user_enc = int(le_user.transform([raw_user])[0])
    else:
        user_enc = 0

    # numeric features
    elapsed_seconds = float(data.get("elapsed_seconds", 1.0))
    elapsed_log     = float(np.log1p(elapsed_seconds))
    hour            = int(data.get("hour", 12))
    week_number     = int(data.get("week_number", 7))
    is_weekend      = int(data.get("is_weekend", 0))
    is_critical     = int(data.get("is_critical_op", 0))

    # feature order must match training exactly
    features = np.array([[
        elapsed_seconds,
        hour,
        week_number,
        is_weekend,
        elapsed_log,
        op_enc,
        user_enc,
        is_critical
    ]])

    scaled    = scaler.transform(features)
    proba     = model.predict_proba(scaled)[0]
    fail_prob = float(proba[0])   # class 0 = failure
    succ_prob = float(proba[1])   # class 1 = success

    if fail_prob >= 0.70:
        risk = "HIGH"
    elif fail_prob >= 0.40:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    result = {
        "prediction":          "FAIL" if fail_prob > 0.5 else "SUCCESS",
        "failure_probability": round(fail_prob * 100, 1),
        "success_probability": round(succ_prob * 100, 1),
        "risk_level":          risk,
        "inputs_used": {
            "operation":   raw_op,
            "user_id":     raw_user,
            "hour":        hour,
            "elapsed_sec": elapsed_seconds,
            "is_weekend":  is_weekend,
            "is_critical": is_critical
        }
    }

    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e), "prediction": "ERROR"}))