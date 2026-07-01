/**
 * ELEO - Back-Office Security Engine
 */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("adminPassword");
    const errorMsg = document.getElementById("errorMsg");

    // Master operational password (Change this whenever you want)
    const MASTER_TOKEN = "Omaadanawo"; 

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Halt default browser submit actions

        const inputVal = passwordInput.value.trim();

        if (inputVal === MASTER_TOKEN) {
            // Set session authorization token marker
            sessionStorage.setItem("eleoAdminAuthenticated", "true");
            
            // Clean interface states and proceed smoothly
            errorMsg.style.display = "none";
            window.location.href = "admin.html";
        } else {
            // Access denied visual treatment
            errorMsg.style.display = "block";
            passwordInput.value = ""; // Empty string clearing safety
            passwordInput.focus();     // Force focus back for quick corrections
        }
    });
});
