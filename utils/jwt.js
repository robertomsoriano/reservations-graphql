// Creates JWT for Auth

const jwt = require("jsonwebtoken");
export const createToken = async (user, secret, expiresIn) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email
    },
    secret,
    { expiresIn: expiresIn }
  );
};

export const auth = async token => {
  let decoded;
  // Check for token
  if (!token) return { msg: "No token, authorizaton denied" };
  try {
    // Verify token
    return (decoded = await jwt.verify(token, "secret"));
  } catch (e) {
    console.log(e);
    return { msg: "Token is not valid" };
  }
};
