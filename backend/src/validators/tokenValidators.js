const { body, param } = require("express-validator");
const { TOKEN_PRIORITY } = require("../utils/constants");

const tokenIdParamValidator = [param("tokenId").isMongoId()];

const createTokenValidator = [
  body("personName").isString().trim().isLength({ min: 1, max: 120 }),
  body("priority").optional().isIn(Object.values(TOKEN_PRIORITY)),
];

const reorderValidator = [
  body("orderedTokenIds").isArray({ min: 1 }),
  body("orderedTokenIds.*").isMongoId(),
];

module.exports = {
  tokenIdParamValidator,
  createTokenValidator,
  reorderValidator,
};
