const express = require("express");
const { listActivityLogs } = require("../controllers/activityLogController");

const router = express.Router();

router.get("/", listActivityLogs);

module.exports = router;
