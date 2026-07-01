/**
 * ELEO - About Page Aesthetic Enhancement Engine
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. DYNAMIC READING PROGRESS BAR ---
    // Create the loading element cleanly behind the scenes
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background-color: var(--primary-gold);
        z-index: 9999;
        transition: width 0.1s ease-out;
    `;
    document.body.appendChild(progressBar);

    // Calculate window scroll position math
    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }
    });

    // --- 2. SMOOTH SCROLL REVEAL (MISSION, VISION & VALUE CARDS) ---
    // Target the components we want to subtly animate on scroll
    const cardsToAnimate = document.querySelectorAll(".mv-card, .value-card");

    // Initialize initial hidden styling states without messing with your CSS file
    cardsToAnimate.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(30px)";
        card.style.transition = "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.25, 1, 0.22, 1)";
    });

    // Configure the observer to watch when cards hit 15% visibility inside screen
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
                observer.unobserve(card); // Stops watching once loaded for peak performance
            }
        });
    };

    const cardObserver = new IntersectionObserver(revealCallback, {
        root: null,
        threshold: 0.15
    });

    // Fire the trigger tracking system
    cardsToAnimate.forEach(card => cardObserver.observe(card));
});
