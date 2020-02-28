const bcrypt = require("bcryptjs");

export async function hashPass(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePass(password, user) {
  return await bcrypt.compare(password, user.password);
  // if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
  // else if (isMatch) {
  //   return true;
  // }
}
