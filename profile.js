async function fetchProfile() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const response = await fetch(`/.netlify/functions/airtable?id=${id}`);
        const data = await response.json();
        
        // Define 'f' only once here
        const f = data.fields;

        if (f) {
            document.getElementById('profile-title').innerText = f['Business Name'] || 'No Name';
            document.getElementById('profile-location').innerText = `📍 ${f['City'] || ''}, ${f['State'] || ''}`;
            document.getElementById('sidebar-location').innerText = `${f['City'] || ''}, ${f['State'] || ''}`;
            document.getElementById('profile-specialties').innerText = f['Specialization'] || '';
            document.getElementById('bio-text').innerText = f['About your business'] || 'No bio available.';

            const setupBtn = (id, url) => {
                const btn = document.getElementById(id);
                if (btn && url) {
                    btn.onclick = () => window.open(url, '_blank');
                } else if (btn) {
                    btn.style.display = 'none';
                }
            };

            setupBtn('link-phone', f['Phone Number'] ? `tel:${f['Phone Number']}` : null);
            setupBtn('link-whatsapp', f['WhatsApp Number'] ? `https://wa.me/${f['WhatsApp Number']}?text=Hello%20I%20found%20your%20profile%20on%20ELEO%20and%20would%20like%20to%20make%20an%20inquiry.` : null);
            setupBtn('link-facebook', f['Facebook']);
            setupBtn('link-instagram', f['Instagram']);
            setupBtn('link-tiktok', f['TikTok']);

            const gallery = document.getElementById('portfolio-target');
            if (gallery && f['Portfolio']) {
                gallery.innerHTML = '';
                f['Portfolio'].forEach(img => {
                    const div = document.createElement('div');
                    div.className = 'portfolio-item';
                    div.innerHTML = `<img src="${img.url}" alt="Portfolio">`;
                    gallery.appendChild(div);
                });
            }
        }
    } catch (e) { 
        console.error("Error:", e); 
        // This is where you were getting the error in the console
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();
});
