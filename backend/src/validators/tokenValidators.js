const { body, param, query } = require("express-validator");
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

const listTokensQueryValidator = [
  query("search").optional().isString().trim().isLength({ min: 1, max: 120 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  tokenIdParamValidator,
  createTokenValidator,
  reorderValidator,
  listTokensQueryValidator,
};
