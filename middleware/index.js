// Middleware to verify JWT to then place user in the "Context" for Resolvers to work with.

const jwt = require("jsonwebtoken");

module.exports = {
  userAuth: async ({ request }) => {
    const token = request.headers.authorization || "";

    let decoded;
    let user;
    // Check for token
    if (!token) return { msg: "No token" };
    try {
      // Verify token
      user = decoded = await jwt.verify(token, "secret"); // Replace with ENV VAR.
      return user;
    } catch (e) {
      // console.log(e);
      return { msg: "Token is not valid" };
    }
  }
};
