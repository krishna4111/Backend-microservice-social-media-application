const express = require("express");
const {
  registerUser,
  loginUser,
  generateRefreshToken,
  logoutUser,
} = require("../controller/identityController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/generate-refresh-token", generateRefreshToken);
router.post("/logout", logoutUser);

module.exports = router;
