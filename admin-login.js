/**
 * ELEO - Back-Office Security Engine
 */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("adminPassword");
    const errorMsg = document.getElementById("errorMsg");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const inputVal = passwordInput.value.trim();

        try {
            const response = await fetch("/.netlify/functions/admin-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    password: inputVal
                })
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem("eleoAdminAuthenticated", "true");
                errorMsg.style.display = "none";
                window.location.href = "admin.html";
            } else {
                errorMsg.style.display = "block";
                passwordInput.value = "";
                passwordInput.focus();
            }

        } catch (err) {
            console.error(err);
            errorMsg.style.display = "block";
        }
    });
});
