const express = require("express");
const {
  getAnalyticsSummary,
  getQueueTrend,
  getStatusDistribution,
  getHourlyTraffic,
} = require("../controllers/analyticsController");
const { queueIdParamValidator } = require("../validators/queueValidators");
const validate = require("../middleware/validate");

const router = express.Router({ mergeParams: true });

router.get("/summary", queueIdParamValidator, validate, getAnalyticsSummary);
router.get("/trend", queueIdParamValidator, validate, getQueueTrend);
router.get("/status-distribution", queueIdParamValidator, validate, getStatusDistribution);
router.get("/hourly-traffic", queueIdParamValidator, validate, getHourlyTraffic);

module.exports = router;
