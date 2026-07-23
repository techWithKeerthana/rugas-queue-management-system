const { body, param } = require("express-validator");

const queueIdParamValidator = [param("queueId").isMongoId()];

const createQueueValidator = [
  body("name").isString().trim().isLength({ min: 2, max: 100 }),
  body("capacity").optional({ nullable: true }).isInt({ min: 1, max: 100000 }),
];

module.exports = {
  queueIdParamValidator,
  createQueueValidator,
};
