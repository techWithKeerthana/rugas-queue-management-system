const { body, param } = require("express-validator");

const queueIdParamValidator = [param("queueId").isMongoId()];
const counterIdParamValidator = [param("counterId").isMongoId()];

const createQueueValidator = [
  body("name").isString().trim().isLength({ min: 2, max: 100 }),
  body("capacity").optional({ nullable: true }).isInt({ min: 1, max: 100000 }),
];

const upsertCounterValidator = [
  body("name").isString().trim().isLength({ min: 1, max: 80 }),
];

module.exports = {
  queueIdParamValidator,
  counterIdParamValidator,
  createQueueValidator,
  upsertCounterValidator,
};
