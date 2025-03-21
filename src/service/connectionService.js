const { subDays, startOfDay, endOfDay } = require('date-fns');
const ConnectionRequest = require('../models/connectionRequest');

const getYesterdayInterestedConnections = async () => {
  const yesterday = subDays(new Date(), 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);

  const requests = await ConnectionRequest.find({
    status: "interested",
    createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
  }).populate("fromUserId toUserId");

  const emails = [...new Set(requests.map(req => req.toUserId.email))];
  return emails;
};

module.exports = { getYesterdayInterestedConnections };
