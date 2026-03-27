/**
 * SpaceX IPO Tracker 2026 - JavaScript
 * Countdown Timer, FAQ Accordion, and Interactions
 */

// ============================================
// 1. COUNTDOWN TIMER
// ============================================

function initCountdown() {
    // Set target date to Q4 2026 (October 1, 2026)
    // This is a speculative estimated IPO window
    const targetDate = new Date('2026-10-01').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update DOM
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        
        // Stop countdown if date is reached
        if (distance < 0) {
            document.getElementById('countdown').innerHTML = '<p style="grid-column: 1/-1; color: #10b981; font-size: 18px; font-weight: 600;">SpaceX IPO Announced! 🚀</p>';
        }
    }
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    setInterval(updateCountdown, 1000);
}

// ============================================
// 2. FAQ ACCORDION
// ============================================

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current FAQ
            item.classList.toggle('active');
        });
    });
}

// ============================================
// 3. SMOOTH SCROLL OFFSET (for sticky header)
// ============================================

function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav a');
    const headerHeight = document.querySelector('.header').offsetHeight;
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ============================================
// 4. EMAIL FORM HANDLING
// ============================================

function initEmailForm() {
    const form = document.querySelector('.email-form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            if (email) {
                // Simulate form submission feedback
                const button = form.querySelector('button');
                const originalText = button.textContent;
                
                button.textContent = '✓ Email Captured';
                button.style.background = '#10b981';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    emailInput.value = '';
                }, 2000);
                
                // In production, this would send to a backend service
                console.log('Email captured:', email);
            }
        });
    }
}

// ============================================
// 5. SCROLL ANIMATIONS (Optional enhancement)
// ============================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all major sections for fade-in effect
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// ============================================
// 6. ACTIVE NAV LINK HIGHLIGHT
// ============================================

function initActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav a');
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === `#${current}`) {
                link.style.color = '#3b82f6';
                link.style.borderBottom = '2px solid #3b82f6';
                link.style.paddingBottom = '5px';
            } else {
                link.style.borderBottom = 'none';
                link.style.paddingBottom = '0';
            }
        });
    });
}

// ============================================
// 7. LIVE VALUATION TICKER (Optional)
// ============================================

function initValuationTicker() {
    // Simulated valuation oscillation for visual interest
    const valuationElement = document.querySelector('.valuation-container');
    
    if (valuationElement) {
        // Random valuation fluctuation between $340B - $380B
        const baseValuation = 350;
        const variance = 30; // ±$30B
        
        setInterval(() => {
            const randomVariance = (Math.random() * variance * 2) - variance;
            const currentValuation = baseValuation + randomVariance;
            
            // This could update a "current-valuation" element if added to HTML
            // For now, this data is available for future use
        }, 5000);
    }
}

// ============================================
// 8. MOBILE MENU ENHANCEMENT
// ============================================

function initMobileResponsive() {
    // Ensure nav links work smoothly on mobile
    const navLinks = document.querySelectorAll('.nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('touchend', function() {
            this.blur();
        });
    });
}

// ============================================
// 9. PERFORMANCE: Lazy load external resources
// ============================================

function deferredLoad() {
    // Add any deferred loading scripts here
    // This ensures page loads fast
}

// ============================================
// 10. ANALYTICS PLACEHOLDER
// ============================================

function initAnalytics() {
    // Placeholder for Google Analytics or similar
    // Add your tracking code here when deploying
    
    // Track page view
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view');
    }
    
    // Track form submission
    const emailForm = document.querySelector('.email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'email_signup', {
                    'event_category': 'engagement',
                    'event_label': 'spacex_ipo_email'
                });
            }
        });
    }
}

// ============================================
// INITIALIZATION - Run on DOM Ready
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('SpaceX IPO Tracker initialized');
    
    // Initialize all features
    initCountdown();
    initFAQ();
    initSmoothScroll();
    initEmailForm();
    initScrollAnimations();
    initActiveNavLink();
    initValuationTicker();
    initMobileResponsive();
    deferredLoad();
    initAnalytics();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get device type
function getDeviceType() {
    if (window.innerWidth <= 480) return 'mobile';
    if (window.innerWidth <= 768) return 'tablet';
    return 'desktop';
}

// Log page metrics (for debugging)
function logPageMetrics() {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        console.log('Page Load Time:', Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms');
        console.log('DOM Ready Time:', Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms');
    }
}

// Call on load
window.addEventListener('load', logPageMetrics);

// ── Prediction Markets Widget ──────────────────────────────────────────────
async function loadPredictionMarkets() {
  const widget = document.getElementById('prediction-widget');
  if (!widget) return;

  try {
    const res = await fetch('/prediction-markets');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    let html = '';

    // Kalshi markets
    if (data.kalshi && data.kalshi.length) {
      html += '<div class="prediction-platform"><div class="platform-header"><img src="https://kalshi.com/favicon.ico" class="platform-icon" onerror="this.style.display=\'none\'"><span class="platform-name">Kalshi</span><span class="platform-badge">Regulated US Exchange</span></div><div class="prediction-markets-list">';
      data.kalshi.forEach(m => {
        const barWidth = Math.max(4, m.yes_pct);
        html += `
          <div class="prediction-market-row">
            <div class="market-question">${m.title}</div>
            <div class="market-odds">
              <div class="odds-bar-wrap">
                <div class="odds-bar yes-bar" style="width:${barWidth}%"></div>
              </div>
              <span class="odds-yes">${m.yes_pct}% YES</span>
              <span class="odds-no">${m.no_pct}% NO</span>
              <span class="market-vol">$${(m.volume/1000).toFixed(0)}K traded</span>
              <a href="${m.url}" target="_blank" rel="sponsored noopener" class="market-trade-btn">Trade ★</a>
            </div>
          </div>`;
      });
      html += '</div></div>';
    }

    // Polymarket markets
    if (data.polymarket && data.polymarket.length) {
      html += '<div class="prediction-platform"><div class="platform-header"><span class="platform-name">Polymarket</span><span class="platform-badge">Crypto Prediction Market</span></div><div class="prediction-markets-list">';
      data.polymarket.forEach(m => {
        const yp = m.yes_pct !== null ? m.yes_pct : '—';
        const barW = m.yes_pct !== null ? Math.max(4, m.yes_pct) : 4;
        html += `
          <div class="prediction-market-row">
            <div class="market-question">${m.question}</div>
            <div class="market-odds">
              <div class="odds-bar-wrap">
                <div class="odds-bar yes-bar" style="width:${barW}%"></div>
              </div>
              <span class="odds-yes">${yp}% YES</span>
              <span class="market-vol">$${(m.volume/1000).toFixed(0)}K vol</span>
              <a href="${m.url}" target="_blank" rel="sponsored noopener" class="market-trade-btn">Trade ★</a>
            </div>
          </div>`;
      });
      html += '</div></div>';
    }

    if (!html) {
      html = '<div class="prediction-loading">No active markets found — check back soon.</div>';
    }

    const updated = new Date(data.updated).toLocaleTimeString();
    html += `<p class="prediction-updated">Last updated: ${updated} · Refreshes every 5 min</p>`;
    widget.innerHTML = html;

  } catch (e) {
    widget.innerHTML = '<div class="prediction-loading">⚠️ Could not load live odds. <a href="https://kalshi.com" target="_blank" rel="noopener">View on Kalshi →</a></div>';
  }
}

// Load on page ready + refresh every 5 min
document.addEventListener('DOMContentLoaded', () => {
  loadPredictionMarkets();
  setInterval(loadPredictionMarkets, 5 * 60 * 1000);
});
