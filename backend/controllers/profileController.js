const bcrypt = require("bcrypt");
const User   = require("../models/User");

/* GET /api/profile */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "avatar", "timezone", "emailPrefs"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /api/profile */
exports.updateProfile = async (req, res) => {
  const { name, timezone, avatar } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name)     user.name     = name.trim();
    if (timezone) user.timezone = timezone;
    if (avatar !== undefined) user.avatar = avatar; // base64 or null

    await user.save();
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /api/profile/password */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Both current and new password are required" });
  if (newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /api/profile/email-prefs */
exports.updateEmailPrefs = async (req, res) => {
  const { emailPrefs } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.emailPrefs = emailPrefs;
    await user.save();
    res.json({ success: true, message: "Email preferences updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};