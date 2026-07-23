const { body } = require("express-validator");

const registerValidator = [
  body("name").isString().trim().isLength({ min: 2, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6, max: 64 }),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6, max: 64 }),
];

module.exports = {
  registerValidator,
  loginValidator,
};
