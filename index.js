/**
 * Eleo Style Engine - Core Homepage Script
 * Architecture: Clean, modular components handling interactions for index.html
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize all core homepage enhancements
    initHeroFadeIn();
    init3DScrollReveal();
    initDynamicCardClicks();
    initImageLightbox();
    initBackToTop();
});

/**
 * 1. HERO FADE-IN ANIMATION
 * Ensures the main headline loads with a smooth premium entry effect.
 */
function initHeroFadeIn() {
    const heroContent = document.querySelector('.hero .container');
    if (heroContent) {
        // Set initial style states via JS for a clean fallback if JS is disabled
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(20px)';
        heroContent.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
        
        // Trigger the animation on the next animation frame
        requestAnimationFrame(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        });
    }
}

/**
 * 2. 3D SCROLL REVEAL ENTRANCE
 * Detects when sections come close to the user's viewport and applies 3D pop transitions.
 */
function init3DScrollReveal() {
    // Targets the key informational elements on your page
    const revealElements = document.querySelectorAll('.why-box, .creator-card, .step-card, .center-cta');
    
    const observerOptions = {
        root: null, // Uses browser viewport
        rootMargin: '0px 0px -80px 0px', // Triggers 80px before entering screen fully
        threshold: 0.1 // Triggers when 10% of element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the active class to trigger the CSS transitions
                entry.target.classList.add('reveal-active');
                // Unobserve so the animation only fires once gracefully
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(element => {
        // Set up structural initial 3D styling states
        element.style.opacity = '0';
        element.style.transform = 'translateZ(-100px) rotateX(10deg) translateY(30px)';
        element.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.2s ease, border-color 0.3s ease';
        
        scrollObserver.observe(element);
    });
}

/**
 * 3. DYNAMIC CARD CLICK & REDIRECTION (METHOD B)
 * Intercepts clicks on creator cards to pass unique profile IDs across pages seamlessly.
 */
function initDynamicCardClicks() {
    const cards = document.querySelectorAll('.creator-card');
    
    cards.forEach(card => {
        // Change pointer to communicate interactivity clearly
        card.style.cursor = 'pointer';
        
        card.addEventListener('click', (e) => {
            // Get the identifier value assigned to the card (e.g., "amina")
            const creatorId = card.getAttribute('data-creator-id');
            
            if (creatorId) {
                // Store the selected ID temporarily in the browser's web storage
                localStorage.setItem('selectedCreatorId', creatorId);
                // Redirect directly to the single master profile page template
                window.location.href = 'profile.html';
            }
        });
    });
}

/**
 * 4. IMAGE POP-UP LIGHTBOX VIEWER
 * Generates a full-screen, high-fidelity view window when clicking fashion asset blocks.
 */
function initImageLightbox() {
    const images = document.querySelectorAll('.creator-img-placeholder');
    
    images.forEach(img => {
        img.style.cursor = 'zoom-in';
        
        img.addEventListener('click', (e) => {
            // Stop card click redirect from executing simultaneously
            e.stopPropagation(); 
            
            // Generate full-screen modal overlay wrapper on the fly
            const lightbox = document.createElement('div');
            lightbox.id = 'lightbox-overlay';
            
            // Match styles to your premium dark aesthetic
            Object.assign(lightbox.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                display: 'flex',
                align-items: 'center',
                justify-content: 'center',
                zIndex: '10000',
                opacity: '0',
                transition: 'opacity 0.4s ease',
                cursor: 'zoom-out'
            });
            
            // Build placeholder context or render actual Unsplash image inside overlay
            const content = document.createElement('div');
            content.innerText = "Eleo Portfolio View";
            Object.assign(content.style, {
                color: 'var(--primary-gold)',
                fontSize: '2rem',
                border: '2px dashed var(--primary-gold)',
                padding: '40px 80px',
                borderRadius: '8px',
                letterSpacing: '2px',
                textTransform: 'uppercase'
            });
            
            lightbox.appendChild(content);
            document.body.appendChild(lightbox);
            
            // Smoothly fade in overlay window
            requestAnimationFrame(() => lightbox.style.opacity = '1');
            
            // Close window cleanly when clicking on background overlay shadow
            lightbox.addEventListener('click', () => {
                lightbox.style.opacity = '0';
                setTimeout(() => lightbox.remove(), 400);
            });
        });
    });
}

/**
 * 5. BACK TO TOP FUNCTIONALITY
 * Creates a floating action target to ease page traversal back to hero view.
 */
function initBackToTop() {
    const topButton = document.createElement('button');
    topButton.innerHTML = '&#8593;'; // Sleek up arrow symbol
    
    Object.assign(topButton.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '45px',
        height: '45px',
        backgroundColor: 'var(--surface-color)',
        color: 'var(--primary-gold)',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.2rem',
        zIndex: '999',
        opacity: '0',
        visibility: 'hidden',
        transition: 'all 0.4s ease',
        fontWeight: 'bold'
    });
    
    document.body.appendChild(topButton);
    
    // Evaluate display layout triggers on page window tracking changes
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            topButton.style.opacity = '1';
            topButton.style.visibility = 'visible';
        } else {
            topButton.style.opacity = '0';
            topButton.style.visibility = 'hidden';
        }
    });
    
    // Smooth scroll bounce response animation setup
    topButton.addEventListener('mouseenter', () => {
        topButton.style.borderColor = 'var(--primary-gold)';
        topButton.style.transform = 'translateY(-3px)';
    });
    topButton.addEventListener('mouseleave', () => {
        topButton.style.borderColor = 'var(--border-color)';
        topButton.style.transform = 'translateY(0)';
    });
    
    topButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
