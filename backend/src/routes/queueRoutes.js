const express = require("express");
const { createQueue, listQueues, getQueue, deleteQueue, archiveQueue, unarchiveQueue } = require("../controllers/queueController");
const { queueIdParamValidator, createQueueValidator } = require("../validators/queueValidators");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/", createQueueValidator, validate, createQueue);
router.get("/", listQueues);
router.get("/:queueId", queueIdParamValidator, validate, getQueue);
router.patch("/:queueId/archive", queueIdParamValidator, validate, archiveQueue);
router.patch("/:queueId/unarchive", queueIdParamValidator, validate, unarchiveQueue);
router.delete("/:queueId", queueIdParamValidator, validate, deleteQueue);

module.exports = router;
