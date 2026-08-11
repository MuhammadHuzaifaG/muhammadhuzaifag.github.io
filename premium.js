/**
 * ==========================================================================
 * PREMIUM FEATURES MODULE - THREE CORE FEATURES
 * Credentials Showcase, Lead Qualifier Form, Resume Download Tracking
 * ==========================================================================
 */

/**
 * 1. CREDENTIALS SHOWCASE
 * Display professional certifications with interactive hover effects
 */
const CredentialsShowcase = (() => {
    const credentials = [
        { 
            title: 'Google Analytics Certified', 
            issuer: 'Google', 
            year: '2024', 
            icon: 'fa-google',
            description: 'Advanced data analysis & insights'
        },
        { 
            title: 'Microsoft Power BI Specialist', 
            issuer: 'Microsoft', 
            year: '2024', 
            icon: 'fa-microsoft',
            description: 'Business intelligence & visualization'
        },
        { 
            title: 'AWS Solutions Architect', 
            issuer: 'Amazon Web Services', 
            year: '2023', 
            icon: 'fa-amazon',
            description: 'Cloud infrastructure design'
        },
        { 
            title: 'B.S. Computer Science', 
            issuer: 'University', 
            year: '2022', 
            icon: 'fa-graduation-cap',
            description: 'Bachelor of Science degree'
        }
    ];

    const init = () => {
        const container = document.getElementById('credentials-container');
        if (!container) return;

        let html = '';
        credentials.forEach((cred, index) => {
            html += `
                <div class="credential-badge" style="animation-delay: ${index * 0.1}s">
                    <div class="credential-icon">
                        <i class="fa-brands ${cred.icon}"></i>
                    </div>
                    <h5 class="credential-title">${cred.title}</h5>
                    <p class="credential-issuer">${cred.issuer}</p>
                    <p class="credential-description">${cred.description}</p>
                    <span class="credential-year">${cred.year}</span>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('%c✓ Credentials Showcase Initialized', 'color: #00bcd4; font-weight: bold;');
    };

    return { init };
})();

/**
 * 2. LEAD QUALIFICATION FORM
 * Smart form that qualifies prospects based on budget and timeline
 */
const LeadQualifier = (() => {
    const init = () => {
        const form = document.getElementById('lead-qualifier-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const budgetSelect = form.querySelector('[name="budget"]');
            const timelineSelect = form.querySelector('[name="timeline"]');
            
            const budget = budgetSelect ? parseInt(budgetSelect.value) : 0;
            const timeline = timelineSelect ? timelineSelect.value : '';

            showQualificationResult(budget, timeline);
        });

        console.log('%c✓ Lead Qualifier Form Initialized', 'color: #00bcd4; font-weight: bold;');
    };

    const showQualificationResult = (budget, timeline) => {
        const result = document.getElementById('qualification-result');
        if (!result) return;

        let recommendation = '';
        let priority = 'standard';
        let icon = 'fa-check';

        if (budget >= 50000 && (timeline === 'urgent' || timeline === 'month')) {
            priority = 'high';
            recommendation = '🔥 Perfect Fit - Premium Enterprise Engagement';
            icon = 'fa-star';
        } else if (budget >= 15000 && timeline !== '') {
            priority = 'medium';
            recommendation = '✓ Strong Opportunity - Ready for Discovery Call';
            icon = 'fa-arrow-up';
        } else if (budget > 0 && timeline !== '') {
            priority = 'standard';
            recommendation = '→ Flexible Project Options Available';
            icon = 'fa-thumbs-up';
        } else {
            priority = 'standard';
            recommendation = '? Please provide budget and timeline information';
            icon = 'fa-info';
        }

        const resultHTML = `
            <div class="qualification-result priority-${priority}">
                <div class="result-header">
                    <i class="fa-solid ${icon}"></i>
                    <h4>Assessment Result</h4>
                </div>
                <p class="result-message">${recommendation}</p>
                <button class="btn btn-primary" onclick="document.getElementById('contact').scrollIntoView({behavior: 'smooth'})">
                    Schedule Consultation
                </button>
            </div>
        `;

        result.innerHTML = resultHTML;

        // Track qualification submission
        trackQualification(budget, timeline, priority);
    };

    const trackQualification = (budget, timeline, priority) => {
        const qualificationData = {
            event: 'lead_qualified',
            metadata: {
                budget_range: budget,
                timeline: timeline,
                priority_level: priority,
                timestamp: new Date().toISOString()
            }
        };
        
        console.log('%c[Lead Qualification Tracked]', 'color: #00bcd4; font-weight: bold;', qualificationData);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(qualificationData);
    };

    return { init };
})();

/**
 * 3. RESUME DOWNLOAD TRACKING
 * Track resume downloads with analytics and provide PDF download
 */
const ResumeDownload = (() => {
    const init = () => {
        const downloadBtn = document.getElementById('download-resume-btn');
        if (!downloadBtn) return;

        downloadBtn.addEventListener('click', handleDownload);
        console.log('%c✓ Resume Download Tracking Initialized', 'color: #00bcd4; font-weight: bold;');
    };

    const handleDownload = () => {
        // Track the download
        const downloadData = {
            event: 'resume_downloaded',
            metadata: {
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                page: window.location.href
            }
        };

        console.log('%c[Resume Download Tracked]', 'color: #00bcd4; font-weight: bold;', downloadData);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(downloadData);

        // Simulate download - Replace with actual resume path
        downloadFile();
    };

    const downloadFile = () => {
        // Create a mock download for demonstration
        // Replace 'assets/resume.pdf' with your actual resume file path
        const resumePath = 'assets/Muhammad-Huzaifa-Resume.pdf';
        
        // Check if file exists by attempting to fetch it
        fetch(resumePath, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    // File exists, proceed with download
                    const link = document.createElement('a');
                    link.href = resumePath;
                    link.download = 'Muhammad-Huzaifa-Portfolio-Resume.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showDownloadConfirmation('Resume downloaded successfully!');
                } else {
                    // File not found
                    showDownloadConfirmation('Resume is being prepared. Please contact for direct copy.', 'error');
                }
            })
            .catch(() => {
                // Network error or CORS issue - Show fallback message
                showDownloadConfirmation('Opening resume in new window...', 'info');
                // Fallback: Open in new window
                window.open(resumePath, '_blank');
            });
    };

    const showDownloadConfirmation = (message, type = 'success') => {
        const btn = document.getElementById('download-resume-btn');
        if (!btn) return;

        const originalText = btn.innerHTML;
        const icon = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation' : 'fa-info';
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';

        btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        btn.style.background = bgColor;
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    };

    return { init };
})();

/**
 * MASTER INITIALIZATION
 * Initialize all three features on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    CredentialsShowcase.init();
    LeadQualifier.init();
    ResumeDownload.init();
    
    console.log('%c✨ Premium Features Loaded Successfully', 'color: #00bcd4; font-size: 16px; font-weight: bold;');
});
