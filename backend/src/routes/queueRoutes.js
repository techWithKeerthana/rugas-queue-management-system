const express = require("express");
const {
	createQueue,
	listQueues,
	getQueue,
	deleteQueue,
	archiveQueue,
	unarchiveQueue,
	addQueueCounter,
	renameQueueCounter,
	removeQueueCounter,
} = require("../controllers/queueController");
const {
	queueIdParamValidator,
	counterIdParamValidator,
	createQueueValidator,
	upsertCounterValidator,
} = require("../validators/queueValidators");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/", createQueueValidator, validate, createQueue);
router.get("/", listQueues);
router.get("/:queueId", queueIdParamValidator, validate, getQueue);
router.patch("/:queueId/archive", queueIdParamValidator, validate, archiveQueue);
router.patch("/:queueId/unarchive", queueIdParamValidator, validate, unarchiveQueue);
router.post("/:queueId/counters", queueIdParamValidator, upsertCounterValidator, validate, addQueueCounter);
router.patch("/:queueId/counters/:counterId", queueIdParamValidator, counterIdParamValidator, upsertCounterValidator, validate, renameQueueCounter);
router.delete("/:queueId/counters/:counterId", queueIdParamValidator, counterIdParamValidator, validate, removeQueueCounter);
router.delete("/:queueId", queueIdParamValidator, validate, deleteQueue);

module.exports = router;
