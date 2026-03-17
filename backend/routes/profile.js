// backend/routes/profile.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/profileController");

router.get("/",             auth, ctrl.getProfile);
router.put("/",             auth, ctrl.updateProfile);
router.put("/password",     auth, ctrl.changePassword);
router.put("/email-prefs",  auth, ctrl.updateEmailPrefs);

module.exports = router;