document.addEventListener("DOMContentLoaded", () => {
    // Configuration
    

    const form = document.getElementById("registration-form");

    // Main Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerText = "Submitting... Please wait";
        submitBtn.disabled = true;

        try {
            // Prepare data from form
            const formData = new FormData(form);
            const fields = {};
            const specializations = [];

            formData.forEach((value, key) => {
                if (key === 'Specialization') {
                    specializations.push(value);
                } else {
                    fields[key] = value;
                }
            });

            fields['Specialization'] = specializations.join(', ');
            fields['Status'] = 'Pending';

            // Send to Airtable
            // Send to your secure Netlify function
const response = await fetch('/.netlify/functions/airtable', {
    method: 'PUT', // We use PUT to signal a new registration
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields })
});


            if (response.ok) {
                alert("Registration successful! Your profile is now pending admin approval.");
                form.reset();
            } else {
                const errorData = await response.json();
                console.error("Airtable Error:", errorData);
                throw new Error("Airtable submission failed.");
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            submitBtn.innerText = "Join Eleo";
            submitBtn.disabled = false;
        }
    });
});
