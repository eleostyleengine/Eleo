exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: "Method Not Allowed"
      })
    };
  }

  try {
    const { password } = JSON.parse(event.body);

    if (!password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Password is required"
        })
      };
    }

    // Compare with the secret stored in Netlify
    if (password === process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true
        })
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        message: "Invalid password"
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal Server Error"
      })
    };
  }
};
