const Token = require("../models/Token");

async function nextTokenNumber(queueId) {
  const latest = await Token.findOne({ queueId }).sort({ tokenNumber: -1 }).lean();
  return latest ? latest.tokenNumber + 1 : 1;
}

module.exports = {
  nextTokenNumber,
};
