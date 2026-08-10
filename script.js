/**
 * ==========================================================================
 * DevAnalytics Portfolio - Core UI Engine & Conversion Tracking
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all core system modules
    TrackerModule.init();
    MatrixModule.init();
    NavigationModule.init();
});

/**
 * 1. CONVERSION TRACKING ENGINE
 * Centralized telemetry handler for business optimization goals and CTA performance analysis.
 */
const TrackerModule = (() => {
    const init = () => {
        const trackingElements = document.querySelectorAll('.tracking-cta');
        
        trackingElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const ctaLocation = element.getAttribute('data-cta-location') || 'Unknown Location';
                const ctaText = element.textContent.trim();
                const destination = element.getAttribute('href');

                // Structured payload for analytics mapping
                const analyticsPayload = {
                    event: 'cta_conversion_click',
                    metadata: {
                        location: ctaLocation,
                        anchorText: ctaText,
                        targetUrl: destination,
                        timestamp: new Date().toISOString(),
                        resolution: `${window.innerWidth}x${window.innerHeight}`
                    }
                };

                // Emulate client-side push to data layer (e.g., Google Tag Manager or BigQuery pipeline)
                logToDataLayer(analyticsPayload);
            });
        });
    };

    const logToDataLayer = (payload) => {
        // Standardized console telemetry indicating event execution
        console.log('%c[Analytics Conversion Pipeline]', 'color: #00bcd4; font-weight: bold;', payload);
        
        // Window level registration for cross-platform scraper integration verification
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);
    };

    return { init };
})();

/**
 * 2. INTERACTIVE PROBLEM-SOLUTION MATRIX MATRIX MODULE
 * Enhances row readability and dynamically injects visual confirmation signals.
 */
const MatrixModule = (() => {
    const init = () => {
        const matrixRows = document.querySelectorAll('.matrix-row:not(.matrix-header)');

        matrixRows.forEach(row => {
            // Apply mouse enter feedback
            row.addEventListener('mouseenter', () => {
                row.style.transform = 'scale(1.01)';
                row.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            });

            // Revert state smoothly on mouse exit
            row.addEventListener('mouseleave', () => {
                row.style.transform = 'scale(1)';
                row.style.boxShadow = 'none';
            });
            
            // Register execution logging for structural tracking metrics
            row.addEventListener('click', () => {
                const bottleneckText = row.querySelector('.cell-problem').textContent.trim();
                console.log(`%c[Matrix Interaction]: Evaluated row focusing on -> "${bottleneckText}"`, 'color: #8892b0;');
            });
        });
    };

    return { init };
})();

/**
 * 3. NAVIGATION & VIEWPORT MANAGEMENT MODULE
 * Configures exact scroll target positioning compensating for floating navbar offsets.
 */
const NavigationModule = (() => {
    const init = () => {
        const scrollLinks = document.querySelectorAll('.nav-links a, .hero-actions a[href^="#"]');
        const navbar = document.querySelector('.navbar');

        scrollLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                // Allow fallback execution if target identifier is a root configuration
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    e.preventDefault();
                    
                    // Dynamic calculation of navigation menu height boundary
                    const navOffset = navbar ? navbar.offsetHeight : 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };

    return { init };
})();

/**
 * SERVERLESS EMAILJS INTEGRATION MODULE
 * Processes form submissions directly from local HTML files straight to Gmail.
 */
const EmailJSEngine = (() => {
    // 1. Initialize the EmailJS client with your Public Key
    const PUBLIC_KEY = "SQi6aBSiz275oYXfb"; 
    const SERVICE_ID = "service_t8xcddy";
    const TEMPLATE_ID = "template_56hnbhp";


    const init = () => {
        // Initialize SDK asset
        emailjs.init({ publicKey: PUBLIC_KEY });

        const form = document.getElementById('consultationForm');
        const statusMessage = document.getElementById('formStatus');

        if (!form || !statusMessage) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Update user UI tracking state
            statusMessage.textContent = "Encrypting and transmitting request directly...";
            statusMessage.style.color = "var(--primary)";

            try {
                // Send the form directly using the DOM element
                const response = await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form);

                if (response.status === 200) {
                    statusMessage.textContent = "✓ Consultation Request Delivered Securely. We will connect shortly.";
                    statusMessage.style.color = "var(--accent)";
                    form.reset();
                } else {
                    statusMessage.textContent = "Transmission pipeline error. Please retry.";
                    statusMessage.style.color = "#ff4a5a";
                }
            } catch (error) {
                console.error("EmailJS Pipeline Error:", error);
                statusMessage.textContent = "Failed to send. Verify your API Key configurations.";
                statusMessage.style.color = "#ff4a5a";
            }
        });
    };

    return { init };
})();

// Initialize the form processor engine
EmailJSEngine.init();

/* ==========================================================================
   ANIMAION TO HERO TXT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const heroContent = document.querySelector(".hero-content");
  
  if (heroContent) {
    // Add the class to trigger CSS transitions
    heroContent.classList.add("visible");
  }
});