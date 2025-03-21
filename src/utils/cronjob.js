const { subDays, startOfDay, endOfDay } = require('date-fns');
const cron = require('node-cron');
const ConnectionRequest = require('../models/connectionRequest');
const emailQueue = require('./queue'); // Import the queue

cron.schedule('02 12 * * *', async () => {
    try {
        console.log('⏱️ Running task every minute');

        const yesterday = subDays(new Date(), 0);
        const yesterdayStart = startOfDay(yesterday);
        const yesterdayEnd = endOfDay(yesterday);

        const pendingRequests = await ConnectionRequest.find({
            status: "interested",
            createdAt: {
                $gte: yesterdayStart,
                $lte: yesterdayEnd
            }
        }).populate("fromUserId toUserId");

        const listOfEmails = [...new Set(pendingRequests.map(req => req.toUserId.email))];

        console.log("📧 Emails to send notifications:", listOfEmails);

        // Add each email to the queue
        listOfEmails.forEach(email => {
            emailQueue.createJob({ email, type: 'connect-request' })
                .retries(3)
                .save();
        });

        // Wait a second to let the jobs save
        setTimeout(async () => {
            const waitingJobs = await emailQueue.getJobs('waiting');
            const activeJobs = await emailQueue.getJobs('active');
            const delayedJobs = await emailQueue.getJobs('delayed');
            const failedJobs = await emailQueue.getJobs('failed');

            console.log(`📋 Current Jobs in Queue:`);
            console.log(`🕐 Waiting: ${waitingJobs.length}`);
            console.log(`⚙️ Active: ${activeJobs.length}`);
            console.log(`⏳ Delayed: ${delayedJobs.length}`);
            console.log(`❌ Failed: ${failedJobs.length}`);

            // Optionally log job details
            waitingJobs.forEach(job => {
                console.log(`📨 Waiting Job ID: ${job.id}, Email: ${job.data.email}`);
            });
        }, 1000); // Give it a second after saving jobs

    } catch (error) {
        console.error("🚨 Error running cron job:", error);
    }
});
