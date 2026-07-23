const express = require("express");
const { body } = require("express-validator");
const { joinQueue } = require("../controllers/publicJoinController");
const validate = require("../middleware/validate");
const { publicJoinLimiter } = require("../middleware/rateLimiters");
const { queueIdParamValidator } = require("../validators/queueValidators");

const router = express.Router();

router.post(
  "/join/:queueId",
  publicJoinLimiter,
  queueIdParamValidator,
  body("personName").isString().trim().isLength({ min: 1, max: 120 }),
  validate,
  joinQueue
);

module.exports = router;
