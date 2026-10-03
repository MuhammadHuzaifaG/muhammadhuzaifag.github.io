/* ==========================================================================
   DEV ANALYTICS PLATFORM ENGINE - MAIN APPLICATION SCRIPT (app.js)
   ========================================================================== */

const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://127.0.0.1:8000"
    : "";https://muhammadhuzaifag-github-io.vercel.app/

const DEFAULT_SQL_QUERY = `SELECT category, SUM(revenue) AS total_revenue
FROM ecommerce_sales
GROUP BY category
ORDER BY total_revenue DESC
LIMIT 5;`;

    /* ----------------------------------------------------------------------
       1. SMOOTH SCROLLING (LENIS.JS) & AOS ANIMATION PIPELINE
       ---------------------------------------------------------------------- */
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
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
       2. LIGHT / DARK THEME ENGINE WITH AUTO BROWSER MODE DETECTION
       ---------------------------------------------------------------------- */
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;

    // Detect browser / OS preferred color scheme
    const mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
        if (window.mainKpiChart && window.sideDonutChart) {
            updateChartThemeColors(theme);
        }
    }

    const savedTheme = localStorage.getItem('dev_theme');
    const initialTheme = savedTheme ? savedTheme : (mediaQueryDark.matches ? 'dark' : 'light');
    applyTheme(initialTheme);

    // Listen to live OS / browser color scheme changes if user hasn't explicitly set preference
    mediaQueryDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('dev_theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            localStorage.setItem('dev_theme', targetTheme);
            applyTheme(targetTheme);
        });
    }

    /* ----------------------------------------------------------------------
       3. MOUSE CURSOR GLOW & NAVIGATION DRAWER
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

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navPipeline.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ----------------------------------------------------------------------
       4. HERO MOUSE PARALLAX PARTICLE CANVAS
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
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
            }

            draw() {
                const isDark = htmlElement.getAttribute('data-theme') === 'dark';
                ctx.fillStyle = isDark ? 'rgba(0, 242, 254, 0.5)' : 'rgba(2, 132, 199, 0.4)';
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

/* =================================================================
    5. HERO IMAGE CAROUSEL SLIDER (Fixed)
    ================================================================= */
function initHeroCarousel() {
    const slides = document.querySelectorAll('.hero-carousel-slide');
    if (slides.length === 0) return;

    let currentIndex = 0;

    // Ensure the first slide is active initially if none are set in HTML
    if (!document.querySelector('.hero-carousel-slide.active')) {
        slides[0].classList.add('active');
    } else {
        // Find the index of the currently active slide from HTML
        slides.forEach((slide, index) => {
            if (slide.classList.contains('active')) {
                currentIndex = index;
            }
        });
    }

    setInterval(() => {
        slides[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
    }, 4500);
}

// Make sure it runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initHeroCarousel();
    initHeroCanvas();
});

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

// ==========================================
// DYNAMIC KPI DASHBOARD WITH WORKING FILTERS
// ==========================================

let lineChartInstance = null;
let doughnutChartInstance = null;
let currentView = 'sales';

// 1. Data Store for Dataset Views
const dashboardViewsData = {
    sales: {
        kpis: {
            val1: "$148,920.00",
            val2: "4.82%",
            val3: "2,841,050",
            val4: "11.4 ms"
        },
        line: {
            label: 'Revenue ($)',
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [12400, 15800, 14200, 19100, 24500, 28900, 34100],
            formatY: (val) => '$' + (val / 1000) + 'k'
        },
        doughnut: {
            labels: ['Organic', 'Direct', 'Referral', 'Paid Social'],
            data: [42, 28, 18, 12]
        }
    },
    retention: {
        kpis: {
            val1: "$94,310.00",
            val2: "88.5%",
            val3: "142,500",
            val4: "8.2 ms"
        },
        line: {
            label: 'Retention Rate (%)',
            labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7'],
            data: [65, 68, 72, 78, 81, 85, 89],
            formatY: (val) => val + '%'
        },
        doughnut: {
            labels: ['30-Day Active', '60-Day Active', '90-Day Active', 'Churned'],
            data: [55, 25, 12, 8]
        }
    },
    scraping: {
        kpis: {
            val1: "$32,150.00",
            val2: "99.4%",
            val3: "18,450,200",
            val4: "4.1 ms"
        },
        line: {
            label: 'Harvest Rate (rec/sec)',
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            data: [1200, 1450, 1890, 2100, 2400, 3100, 3850],
            formatY: (val) => val + ' r/s'
        },
        doughnut: {
            labels: ['E-Commerce', 'Social Media', 'Real Estate', 'Financial'],
            data: [45, 30, 15, 10]
        }
    }
};

// 2. Initialize Charts
function initDashboardCharts() {
    const lineEl = document.getElementById('lineChart');
    const doughnutEl = document.getElementById('doughnutChart');

    if (!lineEl || !doughnutEl) return;

    const initialData = dashboardViewsData[currentView];

    // --- Line Chart Initialization ---
    const lineCtx = lineEl.getContext('2d');
    const gradient = lineCtx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    lineChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: initialData.line.labels,
            datasets: [{
                label: initialData.line.label,
                data: initialData.line.data,
                borderColor: '#00f2fe',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f2fe',
                pointBorderColor: '#0d1726',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0d1726',
                    titleColor: '#ffffff',
                    bodyColor: '#00f2fe',
                    borderColor: 'rgba(0, 242, 254, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 },
                        callback: function(val) {
                            return dashboardViewsData[currentView].line.formatY(val);
                        }
                    }
                }
            }
        }
    });

    // --- Doughnut Chart Initialization ---
    const doughnutCtx = doughnutEl.getContext('2d');
    doughnutChartInstance = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: initialData.doughnut.labels,
            datasets: [{
                data: initialData.doughnut.data,
                backgroundColor: ['#00f2fe', '#8b5cf6', '#10b981', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        boxWidth: 10,
                        padding: 12,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: '#0d1726',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            }
        }
    });
}

// 3. Switch Dataset View (Update KPIs + Charts)
function updateDashboardView(viewKey) {
    if (!dashboardViewsData[viewKey]) return;
    currentView = viewKey;

    const data = dashboardViewsData[viewKey];

    // Update Top KPI Cards
    document.getElementById('kpi-val-1').innerText = data.kpis.val1;
    document.getElementById('kpi-val-2').innerText = data.kpis.val2;
    document.getElementById('kpi-val-3').innerText = data.kpis.val3;
    document.getElementById('kpi-val-4').innerText = data.kpis.val4;

    // Update Line Chart
    if (lineChartInstance) {
        lineChartInstance.data.labels = data.line.labels;
        lineChartInstance.data.datasets[0].label = data.line.label;
        lineChartInstance.data.datasets[0].data = data.line.data;
        lineChartInstance.update('active'); // Smooth transition animation
    }

    // Update Doughnut Chart
    if (doughnutChartInstance) {
        doughnutChartInstance.data.labels = data.doughnut.labels;
        doughnutChartInstance.data.datasets[0].data = data.doughnut.data;
        doughnutChartInstance.update('active'); // Smooth transition animation
    }
}

// 4. Attach Click Handlers to Filter Buttons
function setupDashboardEventListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');

            // Get dataset view key
            const viewKey = targetBtn.getAttribute('data-view');
            updateDashboardView(viewKey);
        });
    });

    // Refresh Button Click Interaction
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.querySelector('i').classList.add('fa-spin');
            setTimeout(() => {
                updateDashboardView(currentView);
                refreshBtn.querySelector('i').classList.remove('fa-spin');
            }, 600);
        });
    }
}

// 5. DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
    initDashboardCharts();
    setupDashboardEventListeners();
});

// Auto-resize handler for mobile screen rotation
window.addEventListener('resize', () => {
    if (lineChartInstance) lineChartInstance.resize();
    if (doughnutChartInstance) doughnutChartInstance.resize();
});

/* ----------------------------------------------------------------------
       7. SQL EXECUTION ENGINE & TABLE RENDERER
       ---------------------------------------------------------------------- */
    const sqlEditor = document.getElementById('sql-editor') || document.getElementById('sql-query') || document.getElementById('sql-input');
    const runQueryBtn = document.getElementById('btn-run-query') || document.getElementById('execute-sql-btn');
    const resultsTable = document.getElementById('sql-results-table');
    const queryStatus = document.getElementById('query-status');
    const executionTimeEl = document.getElementById('execution-time');
    const clearTerminalBtn = document.getElementById('btn-clear-terminal') || document.getElementById('clear-sql-btn');

    if (sqlEditor && (!sqlEditor.value || sqlEditor.value.trim() === '')) {
        sqlEditor.value = DEFAULT_SQL_QUERY;
    }

    function renderSqlTable(rows, columns = []) {
        if (!resultsTable) return;
        const thead = resultsTable.querySelector('thead');
        const tbody = resultsTable.querySelector('tbody');

        if (!rows || rows.length === 0) {
            if (thead) thead.innerHTML = '<tr><th>Status</th></tr>';
            if (tbody) tbody.innerHTML = '<tr><td>Query returned zero rows.</td></tr>';
            return;
        }

        const cols = columns.length > 0 ? columns : Object.keys(rows[0]);
        if (thead) thead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
        if (tbody) {
            tbody.innerHTML = rows.map(row => 
                `<tr>${cols.map(c => `<td>${row[c] !== undefined && row[c] !== null ? row[c] : ''}</td>`).join('')}</tr>`
            ).join('');
        }
    }

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

    if (runQueryBtn && sqlEditor) {
        runQueryBtn.addEventListener('click', async () => {
            const rawQuery = sqlEditor.value.trim();
            if (!rawQuery) return;

            try {
                if (queryStatus) {
                    queryStatus.textContent = "Executing on backend...";
                    queryStatus.style.color = "#ffab00";
                }

                const result = await executeQuery(rawQuery);

                renderSqlTable(result.rows, result.columns);
                
                if (queryStatus) {
                    queryStatus.textContent = "Query Executed Successfully";
                    queryStatus.style.color = "#00e676";
                }
                if (executionTimeEl) {
                    executionTimeEl.textContent = `(${result.execution_time_ms} ms, ${result.row_count} rows)`;
                }

            } catch (err) {
                if (queryStatus) {
                    queryStatus.textContent = `Error: ${err.message}`;
                    queryStatus.style.color = "#ff1744";
                }
            }
        });
    }

    if (clearTerminalBtn && sqlEditor) {
        clearTerminalBtn.addEventListener('click', () => {
            sqlEditor.value = DEFAULT_SQL_QUERY;
            if (queryStatus) queryStatus.textContent = 'Ready';
            if (executionTimeEl) executionTimeEl.textContent = '';
            renderSqlTable([], []);
        });
    }

    /* ----------------------------------------------------------------------
       8. FLOATING AI CHATBOT WORKER ENGINE
       ---------------------------------------------------------------------- */
    const chatWidget = document.getElementById('ai-chat-widget');
    const chatHeaderToggle = document.getElementById('chat-header-toggle');
    const chatInput = document.getElementById('chat-input') || document.getElementById('bot-input');
    const chatSendBtn = document.getElementById('chat-send') || document.getElementById('chat-send-btn');
    const chatBody = document.querySelector('.chat-body') || document.getElementById('chat-messages');

    if (chatHeaderToggle && chatWidget) {
        chatHeaderToggle.addEventListener('click', () => {
            chatWidget.classList.toggle('collapsed');
        });
    }

    function appendMessage(text, className, id = null) {
        if (!chatBody) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${className}`;
        if (id) msgDiv.id = id;
        msgDiv.textContent = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function handleChatSubmit() {
        if (!chatInput) return;
        const query = chatInput.value.trim();
        if (!query) return;

        appendMessage(query, 'user-msg');
        chatInput.value = '';

        const thinkingId = 'thinking-' + Date.now();
        appendMessage("DevBot is thinking...", 'bot-msg', thinkingId);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: query }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();
            
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            if (response.ok) {
                const botReply = data.content || data.reply || "No response content returned.";
                appendMessage(botReply, 'bot-msg');
            } else {
                const errorMsg = data.detail || "Server error processing request.";
                appendMessage(`⚠️ Error: ${errorMsg}`, 'bot-msg');
            }

        } catch (err) {
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            if (err.name === 'AbortError') {
                appendMessage("⚠️ Connection timed out. Please try again.", 'bot-msg');
            } else {
                appendMessage(`⚠️ Network/CORS Error: ${err.message || 'Unable to connect to backend.'}`, 'bot-msg');
            }
        }
    }

    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', handleChatSubmit);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });
    }


// ==========================================
// SEQUENTIAL SCROLL REVEAL FOR PIPELINE CARDS
// ==========================================
function initPipelineAnimation() {
    const cards = document.querySelectorAll('.pipeline-card');
    if (!cards.length) return;

    const observerOptions = {
        root: null,
        threshold: 0.25
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('active');
                    }, index * 200); // 200ms stagger delay between each card
                });
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const pipelineBox = document.querySelector('.pipeline-outer-box');
    if (pipelineBox) observer.observe(pipelineBox);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initPipelineAnimation();
});


// ==========================================
// MOUSE SPOTLIGHT EFFECT ON ABOUT CARD
// ==========================================
function initAboutSpotlight() {
    const card = document.querySelector('.about-card-wrapper');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        card.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(0, 242, 254, 0.07), #0d1726 80%)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.background = '#0d1726';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initAboutSpotlight();
});

/* =================================================================
   8. TESTIMONIALS CAROUSEL SLIDER
   ================================================================= */
function initTestimonialCarousel() {
    const track = document.querySelector('.testimonial-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    const dotsContainer = document.getElementById('testimonial-dots');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;

    // Create dots
    cards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot-indicator ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        if (dotsContainer) dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot-indicator') : [];

    function goToSlide(index) {
        currentIndex = index;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % cards.length;
            goToSlide(currentIndex);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            goToSlide(currentIndex);
        });
    }

    // Auto-slide every 6 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % cards.length;
        goToSlide(currentIndex);
    }, 6000);
}
   

// ==========================================
// SKILLS PILL INTERACTIVE HOVER EFFECTS
// ==========================================
function initSkillsHoverFX() {
    const pills = document.querySelectorAll('.skill-pill');

    pills.forEach(pill => {
        // Dynamic Spotlight Gradient Following Mouse Cursor inside Pill
        pill.addEventListener('mousemove', (e) => {
            const rect = pill.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            pill.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 242, 254, 0.25), rgba(13, 23, 38, 0.9) 70%)`;
        });

        pill.addEventListener('mouseleave', () => {
            pill.style.background = 'rgba(13, 23, 38, 0.85)';
        });
    });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initSkillsHoverFX();
});
// ==========================================
// INTERACTIVE TILT EFFECT FOR CERTIFICATION CARDS
// ==========================================
function initCertTiltEffect() {
    const certCards = document.querySelectorAll('.cert-card');

    certCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// Append to DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    initCertTiltEffect();
});

/* =================================================================
   9. CONTACT FORM VALIDATION & SUBMISSION HANDLER
   ================================================================= */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const message = document.getElementById('user-message').value.trim();

        if (!name || !email || !message) {
            alert('Please fill in all required fields before submitting.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Message...';
        submitBtn.disabled = true;

        // Simulate successful dispatch
        setTimeout(() => {
            alert('Thank you! Your message has been successfully dispatched. I will get back to you shortly.');
            form.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1200);
    });
}
    
/* =================================================================
   9. EMAILJS SECURE TRANSMISSION ENGINE
   ================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const PUBLIC_KEY = "ZkRDI8nlMev_PYPNC";
    const SERVICE_ID = "service_t8xcddy";
    const TEMPLATE_ID = "template_56hnbhp";

    if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: PUBLIC_KEY });
    }

    const form = document.getElementById('consultationForm');
    const statusMsg = document.getElementById('formStatus');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.btn-submit');
            const originalBtnContent = submitBtn.innerHTML;

            submitBtn.innerHTML = '<span>Transmitting...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;
            statusMsg.textContent = "Sending message...";
            statusMsg.style.color = "var(--accent-cyan)";

            try {
                const res = await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form);
                if (res.status === 200) {
                    statusMsg.textContent = "✓ Message sent successfully! I will reach out shortly.";
                    statusMsg.style.color = "#10b981";
                    form.reset();
                } else {
                    throw new Error("Submission error");
                }
            } catch (err) {
                console.error("EmailJS Error:", err);
                statusMsg.textContent = "Failed to send message. Please try again later.";
                statusMsg.style.color = "#ef4444";
            } finally {
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
            }
        });
    }
});

/**
 * Interactive 3D Topological Data Wave & Vector Signal Field
 * Inspired by high-performance AI, Cloud, and Analytics landing pages.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero-particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let animationFrameId;

    // Topology Configuration
    const cols = 48; // Grid density across width
    const rows = 32; // Grid density across depth
    let grid = [];
    let time = 0;

    // Mouse Gravity Field
    const mouse = {
        x: -1000,
        y: -1000,
        targetX: -1000,
        targetY: -1000,
        radius: 220
    };

    function resize() {
        const heroSection = canvas.parentElement;
        width = canvas.width = heroSection.clientWidth;
        height = canvas.height = heroSection.clientHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    canvas.parentElement.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
        mouse.targetX = -1000;
        mouse.targetY = -1000;
    });

    // Particle Flow Vectors travelling along topological wave peaks
    class StreamParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.u = Math.random(); // Normalized grid position X (0 to 1)
            this.v = Math.random(); // Normalized grid position Z (0 to 1)
            this.speed = 0.002 + Math.random() * 0.003;
            this.size = 1.5 + Math.random() * 2;
            this.color = Math.random() > 0.3 ? '#00f2fe' : '#7000ff';
        }

        update() {
            this.u += this.speed;
            if (this.u > 1) this.reset();
        }
    }

    const particleCount = 60;
    const particles = Array.from({ length: particleCount }, () => new StreamParticle());

    // 3D Isometric Projection Helper
    function project(x3d, y3d, z3d) {
        const perspective = 600;
        const fov = perspective / (perspective + z3d);
        
        // Tilt surface towards viewer
        const angleX = 0.55; 
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);

        const rotY = y3d * cosX - z3d * sinX;
        const rotZ = y3d * sinX + z3d * cosX;

        return {
            x: width / 2 + x3d * fov,
            y: height / 2 + rotY * fov + 40,
            scale: fov
        };
    }

    // Main Render Loop
    function render() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        ctx.clearRect(0, 0, width, height);

        // Smooth mouse interpolation
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;

        time += 0.018;

        // 1. Calculate 3D Topological Grid Heights
        grid = [];
        const spacingX = (width * 1.4) / cols;
        const spacingZ = 800 / rows;

        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                const x3d = (c - cols / 2) * spacingX;
                const z3d = (r - rows / 3) * spacingZ;

                // Mathematical wave superposition (Simulates mathematical signals / data topographies)
                const wave1 = Math.sin(c * 0.22 + time * 1.2) * 28;
                const wave2 = Math.cos(r * 0.18 + time * 0.9) * 22;
                const wave3 = Math.sin((c + r) * 0.12 + time * 1.5) * 15;
                
                let baseHeight = wave1 + wave2 + wave3;

                // Project point to 2D canvas to calculate mouse interaction
                const projectedPoint = project(x3d, baseHeight, z3d);
                const dx = mouse.x - projectedPoint.x;
                const dy = mouse.y - projectedPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Gravitational lens displacement near cursor
                if (dist < mouse.radius) {
                    const force = (1 - dist / mouse.radius);
                    baseHeight -= Math.sin(force * Math.PI) * 55;
                }

                grid[r][c] = {
                    x3d,
                    y3d: baseHeight,
                    z3d,
                    proj: project(x3d, baseHeight, z3d)
                };
            }
        }

        // 2. Draw Longitudinal Iso-Curves (Depth Mesh)
        for (let r = 0; r < rows - 1; r++) {
            ctx.beginPath();
            for (let c = 0; c < cols; c++) {
                const p = grid[r][c].proj;
                if (c === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }

            // Depth fade color gradient
            const depthRatio = r / rows;
            const alpha = (1 - depthRatio * 0.85) * (isDark ? 0.35 : 0.22);
            
            ctx.strokeStyle = isDark 
                ? `rgba(0, 242, 254, ${alpha})` 
                : `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 1 + (1 - depthRatio);
            ctx.stroke();
        }

        // 3. Draw Cross-Sectional Grid Lines (Transverse Signals)
        for (let c = 0; c < cols; c += 2) {
            ctx.beginPath();
            for (let r = 0; r < rows; r++) {
                const p = grid[r][c].proj;
                if (r === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            const alpha = 0.12 * (isDark ? 1 : 0.6);
            ctx.strokeStyle = isDark ? `rgba(112, 0, 255, ${alpha})` : `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 4. Update & Render Stream Particles across the Topological Surface
        particles.forEach(p => {
            p.update();
            
            const cIndex = Math.min(Math.floor(p.u * (cols - 1)), cols - 2);
            const rIndex = Math.min(Math.floor(p.v * (rows - 1)), rows - 2);

            const p0 = grid[rIndex][cIndex].proj;
            const p1 = grid[rIndex][cIndex + 1].proj;

            // Interpolate position along topological line
            const frac = (p.u * (cols - 1)) - cIndex;
            const px = p0.x + (p1.x - p0.x) * frac;
            const py = p0.y + (p1.y - p0.y) * frac;

            ctx.beginPath();
            ctx.arc(px, py, p.size * p0.scale, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        animationFrameId = requestAnimationFrame(render);
    }

    render();
});

// Toggle 'scrolled' class on navbar to trigger logo compact animation
const navbar = document.getElementById('master-navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});
