const express = require("express");
const { getPublicTrackStatus } = require("../controllers/publicTrackController");
const { publicTrackLimiter } = require("../middleware/rateLimiters");
const validate = require("../middleware/validate");
const { queueIdParamValidator } = require("../validators/queueValidators");
const { tokenIdParamValidator } = require("../validators/tokenValidators");

const router = express.Router();

router.get("/track/:queueId/:tokenId", publicTrackLimiter, queueIdParamValidator, tokenIdParamValidator, validate, getPublicTrackStatus);

module.exports = router;
