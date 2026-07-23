const express = require("express");
const {
  getAnalyticsSummary,
  getQueueTrend,
  getStatusDistribution,
  getHourlyTraffic,
  getPeriodicReport,
  exportPeriodicReportCSV,
  exportPeriodicReportPDF,
} = require("../controllers/analyticsController");
const { queueIdParamValidator } = require("../validators/queueValidators");
const validate = require("../middleware/validate");

const router = express.Router({ mergeParams: true });

router.get("/summary", queueIdParamValidator, validate, getAnalyticsSummary);
router.get("/trend", queueIdParamValidator, validate, getQueueTrend);
router.get("/status-distribution", queueIdParamValidator, validate, getStatusDistribution);
router.get("/hourly-traffic", queueIdParamValidator, validate, getHourlyTraffic);
router.get("/reports", queueIdParamValidator, validate, getPeriodicReport);
router.get("/reports/export.csv", queueIdParamValidator, validate, exportPeriodicReportCSV);
router.get("/reports/export.pdf", queueIdParamValidator, validate, exportPeriodicReportPDF);

module.exports = router;
