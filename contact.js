// --- ELEO CONTACT INTERACTIVE ENGINE ---
document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("message");
    const charCounter = document.getElementById("counter");

    // This handles the character counter in real-time
    messageInput.addEventListener("input", () => {
        const currentLength = messageInput.value.length;
        charCounter.textContent = `${currentLength} character${currentLength === 1 ? '' : 's'}`;
    });
});

// Function to copy the email address to the clipboard
function copyEmail() {
    const email = "eleosupport@gmail.com";
    
    // Uses the Clipboard API to copy the email string[span_0](start_span)[span_0](end_span)
    navigator.clipboard.writeText(email).then(() => {
        const status = document.getElementById("copy-status");
        status.textContent = "Email copied to clipboard!";
        
        // Clears the status message after 2 seconds[span_1](start_span)[span_1](end_span)
        setTimeout(() => {
            status.textContent = "";
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
}
