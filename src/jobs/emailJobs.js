const emailQueue = require("../queues/emailQueue");


const queueConnectionEmails = async (emails) => {
  for (const email of emails) {
    await emailQueue.createJob({ email, type: 'connect-request' })
      .retries(3)
      .save();
  }
};

const logQueueStatus = async () => {
  const waiting = await emailQueue.getJobs('waiting');
  const active = await emailQueue.getJobs('active');
  const delayed = await emailQueue.getJobs('delayed');
  const failed = await emailQueue.getJobs('failed');

  console.log("📋 Queue Stats:");
  console.log(`🕐 Waiting: ${waiting.length}`);
  console.log(`⚙️ Active: ${active.length}`);
  console.log(`⏳ Delayed: ${delayed.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  waiting.forEach(job => {
    console.log(`📨 Waiting Job ID: ${job.id}, Email: ${job.data.email}`);
  });
};

module.exports = { queueConnectionEmails, logQueueStatus };
