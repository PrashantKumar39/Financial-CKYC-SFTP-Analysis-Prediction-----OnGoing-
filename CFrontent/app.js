const API = "http://localhost:5001";

// ── Boot ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    checkAPI();
    loadStats();
    highlightNav();
});

// ── API health check ─────────────────────────────────────
async function checkAPI() {
    const dot = document.getElementById("api-dot");
    const label = document.getElementById("api-label");
    try {
        const res = await fetch(`${API}/health`);
        if (res.ok) {
            dot.className = "api-dot online";
            label.textContent = "API online";
        } else throw new Error();
    } catch {
        dot.className = "api-dot offline";
        label.textContent = "API offline";
    }
}

// ── Load dashboard stats ──────────────────────────────────
async function loadStats() {
    try {
        const res = await fetch(`${API}/stats`);
        const data = await res.json();
        fillHero(data.summary);
        buildCharts(data);
    } catch (e) {
        console.warn("Could not reach /stats — using local data", e);
        buildChartsLocal();
        fillHeroLocal();
    }
}

// ── Fill hero KPIs ────────────────────────────────────────
function fillHero(s) {
    setText("k-total", s.total_logs.toLocaleString());
    setText("k-fail", s.failure_rate + "%");
    setText("k-crisis", s.crisis_days + " Days");
    setText("k-model", "XGBoost");
}

function fillHeroLocal() {
    setText("k-total", "68,177");
    setText("k-fail", "62.1%");
    setText("k-crisis", "6 Days");
    setText("k-model", "XGBoost");
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Build charts from backend data ───────────────────────
function buildCharts(data) {
    chartDaily(data.daily);
    chartUser(data.users);
    chartError(data.errors);
    chartOp(data.operations);
}

function buildChartsLocal() {
    const daily = [
        { date: "Feb 12", total: 2100, failures: 420, rate: 20 },
        { date: "Feb 13", total: 2200, failures: 528, rate: 24 },
        { date: "Feb 14", total: 2400, failures: 2352, rate: 98 },
        { date: "Feb 15", total: 2600, failures: 2548, rate: 98 },
        { date: "Feb 16", total: 2500, failures: 2450, rate: 98 },
        { date: "Feb 17", total: 2300, failures: 2254, rate: 98 },
        { date: "Feb 18", total: 2200, failures: 2156, rate: 98 },
        { date: "Feb 19", total: 2100, failures: 2058, rate: 98 },
        { date: "Feb 20", total: 2000, failures: 1200, rate: 60 },
        { date: "Feb 21", total: 2100, failures: 840, rate: 40 },
        { date: "Feb 22", total: 2200, failures: 528, rate: 24 },
        { date: "Feb 23", total: 2300, failures: 345, rate: 15 },
        { date: "Feb 28", total: 2200, failures: 308, rate: 14 },
        { date: "Mar 05", total: 2100, failures: 273, rate: 13 },
        { date: "Mar 10", total: 2200, failures: 264, rate: 12 },
        { date: "Mar 13", total: 2000, failures: 240, rate: 12 }
    ];
    const users = [
        { user: "user1", total: 13800, failures: 8556 },
        { user: "user2", total: 13700, failures: 8493 },
        { user: "user3", total: 13600, failures: 8432 },
        { user: "user4", total: 13500, failures: 8370 },
        { user: "user5", total: 13577, failures: 8421 }
    ];
    const errors = [
        { type: "PermissionDenied", count: 28400 },
        { type: "ConnectionTimeout", count: 8200 },
        { type: "AuthFailure", count: 4100 },
        { type: "FileNotFound", count: 1600 },
        { type: "NetworkError", count: 980 }
    ];
    const ops = [
        { op: "upload", failures: 11800, rate: 64.8 },
        { op: "download", failures: 9800, rate: 59.8 },
        { op: "bulk_download", failures: 9100, rate: 64.1 },
        { op: "list", failures: 5800, rate: 57.4 },
        { op: "delete", failures: 2900, rate: 53.7 },
        { op: "mkdir", failures: 1200, rate: 50.0 },
        { op: "rename", failures: 672, rate: 45.5 }
    ];
    chartDaily(daily);
    chartUser(users);
    chartError(errors);
    chartOp(ops);
}

// Chart global defaults
Chart.defaults.color = "#64748b";
Chart.defaults.borderColor = "rgba(255,255,255,0.05)";
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.font.size = 12;

// ── Daily chart ───────────────────────────────────────────
function chartDaily(rows) {
    const ctx = document.getElementById("c-daily");
    if (!ctx) return;
    new Chart(ctx, {
        data: {
            labels: rows.map(r => r.date),
            datasets: [
                {
                    type: "bar",
                    label: "Total Requests",
                    data: rows.map(r => r.total),
                    backgroundColor: "rgba(59,130,246,0.12)",
                    borderColor: "rgba(59,130,246,0.35)",
                    borderWidth: 1,
                    borderRadius: 3,
                    yAxisID: "yVol"
                },
                {
                    type: "line",
                    label: "Failure Rate (%)",
                    data: rows.map(r => r.rate),
                    borderColor: "#ef4444",
                    backgroundColor: "rgba(239,68,68,0.07)",
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: "#ef4444",
                    tension: 0.35,
                    fill: true,
                    yAxisID: "yRate"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { position: "top", labels: { boxWidth: 12, padding: 16 } },
                tooltip: { backgroundColor: "#0d1526", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1, padding: 10 }
            },
            scales: {
                x: { grid: { color: "rgba(255,255,255,0.03)" } },
                yVol: { position: "left", title: { display: true, text: "Requests" }, grid: { color: "rgba(255,255,255,0.03)" } },
                yRate: { position: "right", title: { display: true, text: "Failure %" }, min: 0, max: 100, grid: { display: false } }
            }
        }
    });
}

// ── User chart ────────────────────────────────────────────
function chartUser(users) {
    const ctx = document.getElementById("c-user");
    if (!ctx) return;
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: users.map(u => u.user),
            datasets: [{
                label: "Failures",
                data: users.map(u => u.failures),
                backgroundColor: ["rgba(239,68,68,0.7)", "rgba(239,68,68,0.6)", "rgba(239,68,68,0.5)", "rgba(239,68,68,0.4)", "rgba(239,68,68,0.35)"],
                borderColor: "#ef4444",
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: "#0d1526", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1 }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: "rgba(255,255,255,0.03)" } }
            }
        }
    });
}

// ── Error doughnut ────────────────────────────────────────
function chartError(errors) {
    const ctx = document.getElementById("c-error");
    if (!ctx) return;
    const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#14b8a6"];
    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: errors.map(e => e.type),
            datasets: [{
                data: errors.map(e => e.count),
                backgroundColor: COLORS.map(c => c + "cc"),
                borderColor: COLORS,
                borderWidth: 1,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right", labels: { boxWidth: 10, padding: 14 } },
                tooltip: { backgroundColor: "#0d1526", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1 }
            },
            cutout: "65%"
        }
    });
}

// ── Operations bar ────────────────────────────────────────
function chartOp(ops) {
    const ctx = document.getElementById("c-op");
    if (!ctx) return;
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ops.map(o => o.op),
            datasets: [{
                label: "Failure Rate (%)",
                data: ops.map(o => o.rate),
                backgroundColor: ops.map(o =>
                    o.rate > 62 ? "rgba(239,68,68,0.7)" :
                        o.rate > 55 ? "rgba(245,158,11,0.6)" :
                            "rgba(34,197,94,0.5)"
                ),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: "#0d1526", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1 }
            },
            scales: {
                x: { min: 0, max: 100, grid: { color: "rgba(255,255,255,0.03)" }, title: { display: true, text: "Failure %" } },
                y: { grid: { display: false } }
            }
        }
    });
}

// ── Prediction ────────────────────────────────────────────
async function runPrediction() {
    const btn = document.getElementById("predict-btn");
    const txt = document.getElementById("btn-txt");

    btn.disabled = true;
    txt.textContent = "Running…";

    show("r-idle", false);
    show("r-out", false);
    show("r-err", false);

    const payload = {
        operation: document.getElementById("f-op").value,
        user_id: document.getElementById("f-user").value,
        hour: parseInt(document.getElementById("f-hour").value),
        elapsed_seconds: parseFloat(document.getElementById("f-elapsed").value),
        week_number: parseInt(document.getElementById("f-week").value),
        is_weekend: document.getElementById("f-weekend").checked ? 1 : 0,
        is_critical_op: document.getElementById("f-critical").checked ? 1 : 0
    };

    try {
        const res = await fetch(`${API}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        renderResult(data);
    } catch (err) {
        document.getElementById("err-msg").textContent =
            err.message || "Could not reach the backend. Is the server running?";
        show("r-err", true);
    } finally {
        btn.disabled = false;
        txt.textContent = "Run Prediction";
    }
}

function renderResult(data) {
    const isFail = data.prediction === "FAIL";

    // verdict badge
    const badge = document.getElementById("verdict-badge");
    badge.textContent = data.prediction;
    badge.className = "verdict-badge " + (isFail ? "fail" : "success");

    // probability ring
    const pct = data.failure_probability;
    const circ = 301.6;
    const offset = circ - (circ * pct / 100);

    const fill = document.getElementById("pr-fill");
    fill.style.strokeDashoffset = offset;
    fill.style.stroke = isFail ? "#ef4444" : "#22c55e";

    const pctEl = document.getElementById("prob-pct");
    pctEl.textContent = pct.toFixed(1) + "%";
    pctEl.style.color = isFail ? "#ef4444" : "#22c55e";

    // risk chip
    const chip = document.getElementById("risk-chip");
    chip.textContent = "Risk: " + data.risk_level;
    chip.className = "risk-chip " + data.risk_level;

    // detail rows
    const inp = data.inputs_used || {};
    document.getElementById("result-rows").innerHTML = `
        <div class="rrow"><span class="rrow-key">Operation</span><span class="rrow-val">${inp.operation || "—"}</span></div>
        <div class="rrow"><span class="rrow-key">User</span><span class="rrow-val">${inp.user_id || "—"}</span></div>
        <div class="rrow"><span class="rrow-key">Hour</span><span class="rrow-val">${inp.hour !== undefined ? inp.hour + ":00" : "—"}</span></div>
        <div class="rrow"><span class="rrow-key">Elapsed</span><span class="rrow-val">${inp.elapsed_sec !== undefined ? inp.elapsed_sec + "s" : "—"}</span></div>
        <div class="rrow"><span class="rrow-key">Success prob.</span><span class="rrow-val">${data.success_probability.toFixed(1)}%</span></div>
    `;

    show("r-out", true);
}

// ── Helpers ───────────────────────────────────────────────
function show(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) el.classList.remove("hidden");
    else el.classList.add("hidden");
}

function highlightNav() {
    const sections = ["hero", "dashboard", "predict", "about"];
    const links = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        let current = "hero";
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && window.scrollY >= el.offsetTop - 90) current = id;
        });
        links.forEach(a => {
            a.classList.toggle("active", a.getAttribute("href") === "#" + current);
        });
    });
}