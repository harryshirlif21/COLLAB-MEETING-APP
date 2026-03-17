const User   = require("../models/User");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "An account with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name: name.trim(), email: email.trim(), password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("[REGISTER ERROR]", error.message);
    if (error.name === "SequelizeUniqueConstraintError")
      return res.status(400).json({ message: "An account with this email already exists" });
    if (error.name === "SequelizeValidationError")
      return res.status(400).json({ message: error.errors.map(e => e.message).join(", ") });
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(404).json({ message: "No account found with this email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("[LOGIN ERROR]", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};