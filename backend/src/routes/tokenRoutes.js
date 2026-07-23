const express = require("express");
const {
  listTokens,
  addToken,
  reorderTokens,
  serveTopToken,
  completeToken,
  cancelToken,
  undoTokenAction,
} = require("../controllers/tokenController");
const validate = require("../middleware/validate");
const { queueIdParamValidator } = require("../validators/queueValidators");
const { tokenIdParamValidator, createTokenValidator, reorderValidator } = require("../validators/tokenValidators");

const router = express.Router({ mergeParams: true });

router.get("/", queueIdParamValidator, validate, listTokens);
router.post("/", queueIdParamValidator, createTokenValidator, validate, addToken);
router.patch("/reorder", queueIdParamValidator, reorderValidator, validate, reorderTokens);
router.patch("/serve-top", queueIdParamValidator, validate, serveTopToken);
router.patch("/:tokenId/complete", queueIdParamValidator, tokenIdParamValidator, validate, completeToken);
router.patch("/:tokenId/cancel", queueIdParamValidator, tokenIdParamValidator, validate, cancelToken);
router.patch("/:tokenId/undo", queueIdParamValidator, tokenIdParamValidator, validate, undoTokenAction);

module.exports = router;
