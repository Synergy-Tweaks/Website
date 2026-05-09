/* ========================================
   SynergyOS Website - Interactive Features
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeInteractiveElements();
    setupSmoothScrolling();
});

/* ========================================
   Smooth Scrolling for Navigation Links
   ======================================== */

function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ========================================
   Interactive Feature Cards
   ======================================== */

function initializeInteractiveElements() {
    const featureCards = document.querySelectorAll('.feature-card');
    const buttons = document.querySelectorAll('button');
    
    // Add ripple effect to feature cards
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add click handlers for buttons
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Button clicked:', this.textContent);
            // You can add form handling or navigation logic here
        });
    });
}

/* ========================================
   Scroll Animation for Elements
   ======================================== */

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards and stat items for scroll animations
document.querySelectorAll('.feature-card, .stat-item, .step').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
});

/* ========================================
   Logo Placeholder - Drag and Drop
   ======================================== */

const logoPlaceholder = document.querySelector('.logo-placeholder');

if (logoPlaceholder) {
    // Drag and drop functionality
    logoPlaceholder.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.opacity = '0.7';
    });
    
    logoPlaceholder.addEventListener('dragleave', function() {
        this.style.opacity = '1';
    });
    
    logoPlaceholder.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.opacity = '1';
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.innerHTML = `<img src="${event.target.result}" alt="SynergyOS Logo" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;">`;
                    console.log('Logo updated successfully!');
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please drop an image file');
            }
        }
    });
    
    // Click to select file
    logoPlaceholder.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    logoPlaceholder.innerHTML = `<img src="${event.target.result}" alt="SynergyOS Logo" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;">`;
                    console.log('Logo updated successfully!');
                };
                reader.readAsDataURL(file);
            }
        });
        input.click();
    });
}

/* ========================================
   Screenshot placeholders - drag/drop and click upload
   ======================================== */

const screenshotPlaceholders = document.querySelectorAll('.screenshot-placeholder');

function setupScreenshotPlaceholder(placeholder) {
    placeholder.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    placeholder.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    placeholder.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.innerHTML = `<img src="${event.target.result}" alt="Preview ${this.dataset.id}"><div class="screenshot-caption">${this.dataset.label || ''}</div>`;
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please drop an image file');
            }
        }
    });

    placeholder.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    placeholder.innerHTML = `<img src="${event.target.result}" alt="Preview ${placeholder.dataset.id}"><div class="screenshot-caption">${placeholder.dataset.label || ''}</div>`;
                };
                reader.readAsDataURL(file);
            }
        });
        input.click();
    });
}

if (screenshotPlaceholders.length) {
    screenshotPlaceholders.forEach(ph => setupScreenshotPlaceholder(ph));
}

/* ========================================
   Mobile Menu Toggle (if needed for future)
   ======================================== */

function createMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const navContent = document.querySelector('.nav-content');
    
    if (window.innerWidth <= 768) {
        // Mobile menu logic can be added here
    }
}

// Run on page load and resize
window.addEventListener('load', createMobileMenu);
window.addEventListener('resize', createMobileMenu);

/* ========================================
   Logging and Analytics Hooks
   ======================================== */

function trackPageEvent(eventName, eventData = {}) {
    console.log(`Event: ${eventName}`, eventData);
    // This can be connected to analytics services like Google Analytics, Mixpanel, etc.
}

// Track page view
trackPageEvent('page_view', {
    page: 'SynergyOS Home',
    timestamp: new Date().toISOString()
});
