/**
 * ELEO - Directory Controller with Real-Time Search
 */

const AIRTABLE_BASE_ID = 'appOYtF8CcKQIaSQe'; 
const AIRTABLE_TABLE_NAME = 'REGISTRATION'; 
const API_TOKEN = 'pattdCO7FLrF5A6XF.102d579780db09094bdc53f2e2364be0138ccde7e95a7b773e98fc3bc33c69be';

let allCreators = []; 
let currentDisplayLimit = 6; // Limit for "See More"

async function fetchCreators() {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        const data = await response.json();
        
        if (data.records) {
            allCreators = data.records.filter(r => r.fields.Status === 'Approved');
            renderCreators(allCreators); 
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

function renderCreators(creators) {
    const grid = document.getElementById('listings-grid');
    const btn = document.getElementById('see-more-btn');
    grid.innerHTML = ''; 

    if (creators.length === 0) {
        grid.innerHTML = '<p style="color: white; text-align: center; width: 100%;">No creators found matching your search.</p>';
        btn.style.display = 'none';
        return;
    }

    // Slice based on current display limit
    creators.slice(0, currentDisplayLimit).forEach(record => {
        const f = record.fields;
        // Handle array for specialization
        const specText = Array.isArray(f['Specialization']) ? f['Specialization'].join(', ') : (f['Specialization'] || 'General Fashion');
        
        const card = document.createElement('div');
        card.className = 'creator-card';
        card.innerHTML = `
            <div class="creator-header">
                <h3>${f['Business Name'] || 'Unnamed'}</h3>
                <div class="location-tag">📍 ${f['City'] || 'N/A'}, ${f['State'] || 'N/A'}</div>
            </div>
            <div class="specialties-box">
                <h4>SPECIALTIES:</h4>
                <ul class="specialties-list">
                    <li>${specText}</li>
                </ul>
            </div>
            <div class="verified-badge">✓ VERIFIED CREATOR</div>
            <button class="btn btn-gold" onclick="window.location.href='profile.html?id=${record.id}'">VIEW PROFILE</button>
        `;
        grid.appendChild(card);
    });

    // Hide button if all items are shown
    btn.style.display = (currentDisplayLimit >= creators.length) ? 'none' : 'block';
}

function filterCreators() {
    const nameVal = document.getElementById('search-name').value.toLowerCase().trim();
    const specVal = document.getElementById('search-specialization').value.toLowerCase().trim();
    const locVal = document.getElementById('search-location').value.toLowerCase().trim();

    const filtered = allCreators.filter(r => {
        const f = r.fields;
        const name = (f['Business Name'] || '').toLowerCase();
        const spec = Array.isArray(f['Specialization']) ? f['Specialization'].join(', ').toLowerCase() : (f['Specialization'] || '').toLowerCase();
        const loc = ((f['City'] || '') + ' ' + (f['State'] || '')).toLowerCase();
        
        return name.includes(nameVal) && spec.includes(specVal) && loc.includes(locVal);
    });

    // Reset to first page when filtering
    currentDisplayLimit = 6;
    renderCreators(filtered);
}

// Event Listeners
document.getElementById('search-name').addEventListener('input', filterCreators);
document.getElementById('search-specialization').addEventListener('input', filterCreators);
document.getElementById('search-location').addEventListener('input', filterCreators);
document.getElementById('search-btn').addEventListener('click', filterCreators);

document.getElementById('see-more-btn').addEventListener('click', () => {
    currentDisplayLimit += 6;
    filterCreators(); 
});

document.addEventListener("DOMContentLoaded", fetchCreators);
