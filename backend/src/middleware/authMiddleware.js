const jwt = require("jsonwebtoken");
const User = require("../models/User");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw httpError(401, "Unauthorized");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw httpError(401, "Invalid token");
  }

  const user = await User.findById(decoded.sub).lean();
  if (!user) {
    throw httpError(401, "User not found");
  }

  req.user = { id: user._id.toString(), email: user.email, name: user.name };
  next();
});

module.exports = {
  protect,
};
