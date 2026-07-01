/**
 * ELEO HQ - Admin Controller
 * Manages status updates and table synchronization with Airtable
 */



// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    refreshAllData();
});

async function refreshAllData() {
    await fetchPendingCreators();
    await fetchApprovedCreators();
}

// --- Fetch Pending Creators (Status = Pending) ---
async function fetchPendingCreators() {
    const response = await fetch('/.netlify/functions/airtable?status=Pending');

    const data = await response.json();
    
    const tbody = document.getElementById('applicationRows');
    const counter = document.getElementById('queueTotal');
    
    tbody.innerHTML = '';
    if (!data.records || data.records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No pending registrations</td></tr>';
        counter.textContent = '0';
        return;
    }

    counter.textContent = data.records.length;
    data.records.forEach(record => {
        const f = record.fields;
        tbody.insertAdjacentHTML('beforeend', `
            <tr data-db-id="${record.id}">
                <td style="color: #fff; font-weight: 600;">${f['Business Name'] || 'N/A'}</td>
                <td>${f['Specialization'] || 'General'}</td>
                <td>${f['Email'] || 'N/A'}</td>
                <td>${f['Instagram'] || '-'}</td>
                <td>${f['Facebook'] || '-'}</td>
                <td>${f['TikTok'] || '-'}</td>
                <td>
                    <div class="action-cluster">
                        <button class="action-btn btn-verify" onclick="approveCreator('${record.id}')">Approve</button>
                    </div>
                </td>
            </tr>
        `);
    });
}

// --- Fetch Approved Creators (Status = Approved) ---
async function fetchApprovedCreators() {
    const response = await fetch('/.netlify/functions/airtable?status=Approved');

    const data = await response.json();
    
    const tbody = document.getElementById('activeRegistryRows');
    const counter = document.getElementById('activeNetworkTotal');
    
    tbody.innerHTML = '';
    if (!data.records || data.records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No approved creators</td></tr>';
        counter.textContent = '0';
        return;
    }

    counter.textContent = data.records.length;
    data.records.forEach(record => {
        const f = record.fields;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="color: #fff; font-weight: 600;">${f['Business Name'] || 'N/A'}</td>
                <td>📍 ${f['City'] || 'N/A'}, ${f['State'] || 'N/A'}</td>
                <td>N/A</td>
                <td style="color: var(--action-green); font-weight: bold;">0 orders</td>
                <td><span class="badge-live">Approved</span></td>
                <td></td>
            </tr>
        `);
    });
}

// --- Update Airtable Status ---
async function approveCreator(recordId) {
    await fetch('/.netlify/functions/airtable', {
    method: 'POST',
    body: JSON.stringify({ recordId })
});


    // Refresh tables after update
    refreshAllData();
}
