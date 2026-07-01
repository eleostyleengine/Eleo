/**
 * ELEO - Frequently Asked Questions Animation Engine
 * Injects Accordion, Hover Physics, Scroll Reveal, and Progress Elements dynamically.
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. DYNAMIC READING PROGRESS BAR ---
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

    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }
    });

    // --- 2. ACCORDION SYSTEM & HOVER INJECTION ---
    const faqCards = document.querySelectorAll(".faq-card");

    faqCards.forEach(card => {
        const question = card.querySelector(".faq-question");
        const answer = card.querySelector(".faq-answer");

        // Prepare operational styling constraints programmatically
        card.style.cursor = "pointer";
        card.style.transition = "all 0.4s cubic-bezier(0.25, 1, 0.22, 1)";
        
        // Setup Answer for clean slide transitions
        answer.style.overflow = "hidden";
        answer.style.maxHeight = "0px";
        answer.style.transition = "max-height 0.35s ease-out, margin-top 0.35s ease";

        // Append interactive Indicator status icon
        const indicator = document.createElement("span");
        indicator.innerHTML = "&#43;"; // Unicode plus symbol
        indicator.style.cssText = "font-size: 1.4rem; transition: transform 0.3s ease, color 0.3s ease; margin-left: 15px;";
        question.appendChild(indicator);

        // Click Event -> Toggle Accordion state
        card.addEventListener("click", () => {
            const isOpen = answer.style.maxHeight !== "0px";

            // Close all open cards to keep it clean (Single Accordion mode)
            faqCards.forEach(c => {
                c.querySelector(".faq-answer").style.maxHeight = "0px";
                c.querySelector(".faq-answer").style.marginTop = "0px";
                c.querySelector(".faq-question span").innerHTML = "&#43;";
                c.querySelector(".faq-question span").style.transform = "rotate(0deg)";
                c.style.backgroundColor = "var(--surface-color)";
                c.style.borderColor = "var(--border-color)";
            });

            // If it wasn't open, open it now
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + "px";
                answer.style.marginTop = "10px";
                indicator.innerHTML = "&minus;"; // Unicode minus symbol
                indicator.style.transform = "rotate(180deg)";
                card.style.backgroundColor = "#252525"; // Active color highlights
                card.style.borderColor = "var(--primary-gold)";
            }
        });

        // Add Luxury Hover Mechanics (only if the card is not active)
        card.addEventListener("mouseenter", () => {
            if (answer.style.maxHeight === "0px") {
                card.style.transform = "translateY(-4px)";
                card.style.boxShadow = "0 10px 25px rgba(212, 175, 55, 0.12)";
                card.style.borderColor = "var(--primary-gold)";
            }
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)";
            card.style.boxShadow = "none";
            if (answer.style.maxHeight === "0px") {
                card.style.borderColor = "var(--border-color)";
            }
        });
    });

    // --- 3. PERFORMANCE-FOCUSED SCROLL REVEAL ---
    // Target both the sidebar and the list stack elements
    const elementsToReveal = document.querySelectorAll(".faq-sidebar, .faq-card");

    elementsToReveal.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(25px)";
        // Append entry properties safely alongside existing CSS setups
        el.style.transition += el.style.transition ? ", opacity 0.6s ease, transform 0.6s ease" : "opacity 0.6s ease, transform 0.6s ease";
    });

    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                target.style.opacity = "1";
                target.style.transform = "translateY(0)";
                observer.unobserve(target); // Unobserve to free engine processing power
            }
        });
    }, observerOptions);

    elementsToReveal.forEach(el => revealObserver.observe(el));
});
