const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET"];

function validateEnv() {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

module.exports = {
  validateEnv,
};
