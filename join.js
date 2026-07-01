document.addEventListener("DOMContentLoaded", () => {
    // Configuration
    const AIRTABLE_BASE_ID = 'appOYtF8CcKQIaSQe';
    const AIRTABLE_TABLE_NAME = 'REGISTRATION';
    const API_TOKEN = 'pattdCO7FLrF5A6XF.102d579780db09094bdc53f2e2364be0138ccde7e95a7b773e98fc3bc33c69be';

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
            const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: fields, typecast: true })
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
