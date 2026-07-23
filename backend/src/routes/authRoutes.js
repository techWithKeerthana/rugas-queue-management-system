const express = require("express");
const { register, login, logout, me } = require("../controllers/authController");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const { registerValidator, loginValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

module.exports = router;
