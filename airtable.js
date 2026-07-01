exports.handler = async (event) => {
  const BASE_ID = 'appOYtF8CcKQIaSQe'; 
  const TABLE_NAME = 'REGISTRATION';
  const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
  const headers = { 
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json' 
  };

  // 1. Handle GET (Fetching lists OR a specific profile)
  if (event.httpMethod === 'GET') {
    const { status, id } = event.queryStringParameters;
    
    // If an ID is provided, fetch that specific record (used by profile.js)
    if (id) {
        const response = await fetch(`${AIRTABLE_URL}/${id}`, { headers });
        return { statusCode: 200, body: await response.text() };
    }
    
    // Otherwise, fetch by status (used by admin.js and directories.js)
    const filterStatus = status || 'Pending';
    const response = await fetch(`${AIRTABLE_URL}?filterByFormula={Status}='${filterStatus}'`, { headers });
    return { statusCode: 200, body: await response.text() };
  }

  // 2. Handle POST (Approving a creator - used by admin.js)
  if (event.httpMethod === 'POST') {
    const { recordId } = JSON.parse(event.body);
    const response = await fetch(`${AIRTABLE_URL}/${recordId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: { Status: 'Approved' } })
    });
    return { statusCode: 200, body: await response.text() };
  }

  // 3. Handle PUT (New Registration - used by join.js)
  if (event.httpMethod === 'PUT') {
    const { fields } = JSON.parse(event.body);
    const response = await fetch(AIRTABLE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields: fields, typecast: true })
    });
    return { statusCode: 200, body: await response.text() };
  }
  
  return { statusCode: 405, body: 'Method Not Allowed' };
};
