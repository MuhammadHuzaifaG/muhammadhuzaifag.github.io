/* ==========================================================================
   DEV ANALYTICS PLATFORM ENGINE - MAIN APPLICATION SCRIPT (app.js)
   ========================================================================== */
// Add this at the top of app.js
const API_BASE_URL = "https://dev-analytics-api.onrender.com"; 

// Example: Calling the live SQL execution endpoint on Render
async function executeLiveQuery(queryText) {
    const response = await fetch(`${API_BASE_URL}/api/v1/sql/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, limit: 50 })
    });
    return await response.json();
}

document.addEventListener('DOMContentLoaded', () => {
    
    /* ----------------------------------------------------------------------
       1. SMOOTH SCROLLING (LENIS.JS) & AOS ANIMATION PIPELINE
       ---------------------------------------------------------------------- */
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smoothTouch: false
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 80
        });
    }

    /* ----------------------------------------------------------------------
       2. LIGHT / DARK THEME ENGINE WITH LOCAL STORAGE PERSISTENCE
       ---------------------------------------------------------------------- */
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;

    // Load saved preference or default to dark mode
    const savedTheme = localStorage.getItem('dev_theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('dev_theme', targetTheme);
            
            // Redraw charts to update text color schemes
            if (window.mainKpiChart && window.sideDonutChart) {
                updateChartThemeColors(targetTheme);
            }
        });
    }

    /* ----------------------------------------------------------------------
       3. INTERACTIVE MOUSE CURSOR GLOW & NAVIGATION DRAWER
       ---------------------------------------------------------------------- */
    const mouseFollower = document.getElementById('mouse-follower');
    if (mouseFollower) {
        window.addEventListener('mousemove', (e) => {
            mouseFollower.style.left = `${e.clientX}px`;
            mouseFollower.style.top = `${e.clientY}px`;
        });
    }

    const navToggle = document.querySelector('.mobile-nav-toggle');
    const navPipeline = document.querySelector('.nav-pipeline');

    if (navToggle && navPipeline) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navPipeline.classList.toggle('active');
        });

        // Close menu on link selection
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navPipeline.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ----------------------------------------------------------------------
       4. HERO MOUSE PARALLAX PARTICLE CANVAS PHYSICS
       ---------------------------------------------------------------------- */
    const canvas = document.getElementById('hero-particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: null, y: null, radius: 120 };

        function resizeCanvas() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
            }

            draw() {
                ctx.fillStyle = 'rgba(0, 242, 254, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                // Mouse interaction physics
                if (mouse.x !== null && mouse.y !== null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        let force = (mouse.radius - distance) / mouse.radius;
                        this.x -= (dx / distance) * force * 3;
                        this.y -= (dy / distance) * force * 3;
                    }
                }
            }
        }

        function initParticles() {
            particles = [];
            const count = Math.floor((canvas.width * canvas.height) / 10000);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }
        initParticles();

        function animateCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }

    /* ----------------------------------------------------------------------
       5. HERO MINI KPI COUNT-UP ANIMATION
       ---------------------------------------------------------------------- */
    const kpiMiniNumbers = document.querySelectorAll('.kpi-mini-number');
    let animated = false;

    const animateCounters = () => {
        kpiMiniNumbers.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const duration = 2000;
            const startTime = performance.now();

            const updateValue = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = (progress * target).toFixed(target % 1 === 0 ? 0 : 1);
                counter.textContent = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(updateValue);
                }
            };
            requestAnimationFrame(updateValue);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !animated) {
            animateCounters();
            animated = true;
        }
    }, { threshold: 0.5 });

    const heroStrip = document.querySelector('.hero-kpi-strip');
    if (heroStrip) observer.observe(heroStrip);

    /* ----------------------------------------------------------------------
       6. LIVE INTERACTIVE KPI DASHBOARD (CHART.JS)
       ---------------------------------------------------------------------- */
    const mainCtx = document.getElementById('main-kpi-chart')?.getContext('2d');
    const sideCtx = document.getElementById('side-donut-chart')?.getContext('2d');

    const datasets = {
        sales: {
            title: "Sales & Revenue Velocity Trends",
            subtitle: "Aggregated daily transactions across CRM & e-commerce endpoints",
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [12400, 15800, 14200, 19100, 24500, 28900, 34020],
            revenue: "$148,920.00",
            conversion: "4.82%",
            donutData: [45, 25, 18, 12],
            donutLabels: ['Organic', 'Direct', 'Referral', 'Paid Social']
        },
        user_retention: {
            title: "User Retention & Active Cohorts",
            subtitle: "Weekly active user retention analysis across digital assets",
            labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7'],
            data: [100, 78, 65, 58, 54, 51, 49],
            revenue: "84.2% DAU/MAU",
            conversion: "62.4%",
            donutData: [60, 25, 15],
            donutLabels: ['Desktop', 'Mobile App', 'Web App']
        },
        scraping: {
            title: "Data Scraping & Extraction Pipeline Throughput",
            subtitle: "Real-time records harvested per hour across target domains",
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            data: [320000, 410000, 580000, 720000, 890000, 650000, 480000],
            revenue: "2,841,050",
            conversion: "99.85%",
            donutData: [50, 30, 20],
            donutLabels: ['PostgreSQL', 'SQLite Engine', 'Cloud Storage']
        }
    };

    let activeDatasetKey = 'sales';

    if (mainCtx && sideCtx && typeof Chart !== 'undefined') {
        window.mainKpiChart = new Chart(mainCtx, {
            type: 'line',
            data: {
                labels: datasets.sales.labels,
                datasets: [{
                    label: 'Performance Metric',
                    data: datasets.sales.data,
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0, 242, 254, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00f2fe',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });

        window.sideDonutChart = new Chart(sideCtx, {
            type: 'doughnut',
            data: {
                labels: datasets.sales.donutLabels,
                datasets: [{
                    data: datasets.sales.donutData,
                    backgroundColor: ['#00f2fe', '#7000ff', '#00e676', '#ffab00'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } }
            }
        });

        // Dataset filter selector
        document.querySelectorAll('.dash-btn[data-dataset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.dash-btn[data-dataset]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                activeDatasetKey = e.currentTarget.getAttribute('data-dataset');
                const ds = datasets[activeDatasetKey];

                document.getElementById('main-chart-title').textContent = ds.title;
                document.getElementById('main-chart-subtitle').textContent = ds.subtitle;
                document.getElementById('kpi-revenue').textContent = ds.revenue;
                document.getElementById('kpi-conversion').textContent = ds.conversion;

                window.mainKpiChart.data.labels = ds.labels;
                window.mainKpiChart.data.datasets[0].data = ds.data;
                window.mainKpiChart.update();

                window.sideDonutChart.data.labels = ds.donutLabels;
                window.sideDonutChart.data.datasets[0].data = ds.donutData;
                window.sideDonutChart.update();
            });
        });

        // Live stream updates simulation
        let liveStreaming = true;
        const liveToggleBtn = document.getElementById('dash-live-toggle');
        const liveStatusText = document.getElementById('live-stream-status');

        if (liveToggleBtn) {
            liveToggleBtn.addEventListener('click', () => {
                liveStreaming = !liveStreaming;
                liveStatusText.textContent = liveStreaming ? 'ON' : 'OFF';
                liveToggleBtn.classList.toggle('live-pulse-btn', liveStreaming);
            });
        }

        setInterval(() => {
            if (liveStreaming && window.mainKpiChart) {
                const dataArray = window.mainKpiChart.data.datasets[0].data;
                const lastVal = dataArray[dataArray.length - 1];
                const delta = (Math.random() - 0.48) * (lastVal * 0.05);
                dataArray[dataArray.length - 1] = Math.round(lastVal + delta);
                window.mainKpiChart.update('none');
            }
        }, 2000);
    }

    function updateChartThemeColors(theme) {
        const textColor = theme === 'dark' ? '#94a3b8' : '#475569';
        const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        if (window.mainKpiChart) {
            window.mainKpiChart.options.scales.x.ticks.color = textColor;
            window.mainKpiChart.options.scales.y.ticks.color = textColor;
            window.mainKpiChart.options.scales.x.grid.color = gridColor;
            window.mainKpiChart.options.scales.y.grid.color = gridColor;
            window.mainKpiChart.update();
        }
        if (window.sideDonutChart) {
            window.sideDonutChart.options.plugins.legend.labels.color = textColor;
            window.sideDonutChart.update();
        }
    }

    /* ----------------------------------------------------------------------
       7. SQL EXECUTION ENGINE CONNECTED TO RENDER API
       ---------------------------------------------------------------------- */
    const sqlEditor = document.getElementById('sql-editor');
    const runQueryBtn = document.getElementById('btn-run-query');
    const resultsTable = document.getElementById('sql-results-table');
    const queryStatus = document.getElementById('query-status');
    const executionTimeEl = document.getElementById('execution-time');

    // Async helper function to send query to Render API
    async function executeQuery(sqlQuery) {
        const response = await fetch(`${API_BASE_URL}/api/v1/sql/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: sqlQuery })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Server error processing query.");
        }
        return await response.json();
    }

    if (runQueryBtn && sqlEditor && resultsTable) {
        runQueryBtn.addEventListener('click', async () => {
            const rawQuery = sqlEditor.value.trim();
            
            try {
                queryStatus.textContent = "Executing on Render backend...";
                queryStatus.style.color = "var(--accent-orange)";

                // Fetch real results from Render FastAPI server
                const result = await executeQuery(rawQuery);

                renderSqlTable(result.rows);
                
                queryStatus.textContent = "Query Executed Successfully";
                queryStatus.style.color = "var(--accent-green)";
                if (executionTimeEl) {
                    executionTimeEl.textContent = `(${result.execution_time_ms} ms, ${result.row_count} rows)`;
                }

            } catch (err) {
                queryStatus.textContent = `Error: ${err.message}`;
                queryStatus.style.color = "var(--accent-red)";
            }
        });
    }

    /* ----------------------------------------------------------------------
       8. VANILLA-TILT MICRO-INTERACTION INITIALIZATION
       ---------------------------------------------------------------------- */
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".project-card, .kpi-card"), {
            max: 8,
            speed: 400,
            glare: true,
            "max-glare": 0.15
        });
    }

    /* ----------------------------------------------------------------------
       9. FLOATING AI CHATBOT WORKER ENGINE (CONNECTED TO GROQ API)
       ---------------------------------------------------------------------- */
    async function handleChatSubmit() {
        const query = chatInput.value.trim();
        if (!query) return;

        // Render User Message
        appendMessage(query, 'user-msg');
        chatInput.value = '';

        // Render Thinking Indicator
        const thinkingId = 'thinking-' + Date.now();
        appendMessage("DevBot is thinking...", 'bot-msg', thinkingId);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: query }]
                })
            });

            const data = await response.json();
            
            // Remove thinking indicator and show actual LLM response
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            appendMessage(data.content, 'bot-msg');

        } catch (err) {
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();
            
            appendMessage("Error communicating with AI assistant. Please try again.", 'bot-msg');
        }
    }

    /* ----------------------------------------------------------------------
       10. CONSULTATION FORM TRANSMISSION
       ---------------------------------------------------------------------- */
    const contactForm = document.getElementById('consultation-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert("Request transmitted successfully! Muhammad Huzaifa will review your project specs shortly.");
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1200);
        });
    }
});