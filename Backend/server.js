const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn, execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5001;

// ── Resolve the correct Python binary ──────────────────────
// Priority: PYTHON env var → conda base → pyenv shim → python3 → python
function resolvePython() {
    if (process.env.PYTHON) return process.env.PYTHON;

    const candidates = [
        // conda base (macOS / Linux)
        path.join(process.env.HOME || "", "anaconda3", "bin", "python"),
        path.join(process.env.HOME || "", "miniconda3", "bin", "python"),
        path.join(process.env.HOME || "", "opt", "anaconda3", "bin", "python"),
        // pyenv shim
        path.join(process.env.HOME || "", ".pyenv", "shims", "python3"),
        // system
        "/usr/local/bin/python3",
        "/usr/bin/python3",
        "python3",
        "python"
    ];

    for (const p of candidates) {
        try {
            execSync(`"${p}" -c "import joblib" 2>/dev/null`, { stdio: "ignore" });
            console.log(`✓ Using Python: ${p}`);
            return p;
        } catch (_) { /* try next */ }
    }

    console.warn("⚠  Could not find a Python with joblib — falling back to python3");
    return "python3";
}

const PYTHON = resolvePython();

app.use(cors());
app.use(express.json());

// Serve frontend from ../CFrontend (adjust if your folder differs)
app.use(express.static(path.join(__dirname, "..", "CFrontend")));

// ── Health ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "CKYC Backend Running", python: PYTHON });
});

// ── Prediction ──────────────────────────────────────────────
app.post("/predict", (req, res) => {
    const inputJson = JSON.stringify(req.body);

    const py = spawn(PYTHON, [
        path.join(__dirname, "predict.py"),
        inputJson
    ]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", chunk => { stdout += chunk.toString(); });
    py.stderr.on("data", chunk => { stderr += chunk.toString(); });

    py.on("close", code => {
        if (code !== 0) {
            console.error("predict.py error:\n", stderr);
            return res.status(500).json({ error: "Model failed", detail: stderr.trim() });
        }
        try {
            res.json(JSON.parse(stdout.trim()));
        } catch (e) {
            console.error("JSON parse failed:", stdout);
            res.status(500).json({ error: "Bad response from model", raw: stdout.trim() });
        }
    });

    py.on("error", err => {
        res.status(500).json({
            error: `Cannot start Python (${PYTHON}). Is it installed and does it have joblib?`,
            detail: err.message
        });
    });
});

// ── Stats ───────────────────────────────────────────────────
app.get("/stats", (_req, res) => {
    res.json({
        summary: {
            total_logs: 68177,
            failure_rate: 62.1,
            success_rate: 37.9,
            total_users: 5,
            days_tracked: 30,
            crisis_days: 6,
            top_error: "PermissionDenied",
            retry_pct: 41.3
        },
        daily: [
            { date: "Feb 12", total: 2100, failures: 420, rate: 20.0 },
            { date: "Feb 13", total: 2200, failures: 528, rate: 24.0 },
            { date: "Feb 14", total: 2400, failures: 2352, rate: 98.0 },
            { date: "Feb 15", total: 2600, failures: 2548, rate: 98.0 },
            { date: "Feb 16", total: 2500, failures: 2450, rate: 98.0 },
            { date: "Feb 17", total: 2300, failures: 2254, rate: 98.0 },
            { date: "Feb 18", total: 2200, failures: 2156, rate: 98.0 },
            { date: "Feb 19", total: 2100, failures: 2058, rate: 98.0 },
            { date: "Feb 20", total: 2000, failures: 1200, rate: 60.0 },
            { date: "Feb 21", total: 2100, failures: 840, rate: 40.0 },
            { date: "Feb 22", total: 2200, failures: 528, rate: 24.0 },
            { date: "Feb 23", total: 2300, failures: 345, rate: 15.0 },
            { date: "Feb 28", total: 2200, failures: 308, rate: 14.0 },
            { date: "Mar 05", total: 2100, failures: 273, rate: 13.0 },
            { date: "Mar 10", total: 2200, failures: 264, rate: 12.0 },
            { date: "Mar 13", total: 2000, failures: 240, rate: 12.0 }
        ],
        users: [
            { user: "user1", total: 13800, failures: 8556 },
            { user: "user2", total: 13700, failures: 8493 },
            { user: "user3", total: 13600, failures: 8432 },
            { user: "user4", total: 13500, failures: 8370 },
            { user: "user5", total: 13577, failures: 8421 }
        ],
        errors: [
            { type: "PermissionDenied", count: 28400 },
            { type: "ConnectionTimeout", count: 8200 },
            { type: "AuthFailure", count: 4100 },
            { type: "FileNotFound", count: 1600 },
            { type: "NetworkError", count: 980 }
        ],
        operations: [
            { op: "upload", failures: 11800, rate: 64.8 },
            { op: "download", failures: 9800, rate: 59.8 },
            { op: "bulk_download", failures: 9100, rate: 64.1 },
            { op: "list", failures: 5800, rate: 57.4 },
            { op: "delete", failures: 2900, rate: 53.7 },
            { op: "mkdir", failures: 1200, rate: 50.0 },
            { op: "rename", failures: 672, rate: 45.5 }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`\nCKYC backend → http://localhost:${PORT}`);
    console.log(`Python binary → ${PYTHON}\n`);
});