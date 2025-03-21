const cron = require('node-cron');

const { queueConnectionEmails, logQueueStatus } = require('../jobs/emailJobs');
const { getYesterdayInterestedConnections } = require('../service/connectionService');

cron.schedule('00 08 * * *', async () => {
  try {
    console.log('⏱️ Running 8 AM connection reminder job');

    const emails = await getYesterdayInterestedConnections();
    console.log("📧 Emails to notify:", emails);

    await queueConnectionEmails(emails);
    
    setTimeout(async () => {
      await logQueueStatus();
    }, 1000);

  } catch (err) {
    console.error("🚨 Cron job error:", err);
  }
});
