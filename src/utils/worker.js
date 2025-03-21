const sendEmail = require('../config/nodemailer');
const emailQueue = require('./queue');

emailQueue.process(async (job, done) => {
    try {
        await sendEmail(job.data.email, job.data.type, "You have a new connection request. Please login and connect or reject.");
        done(); // Mark job as done
    } catch (error) {
        console.error(`Failed to send email to ${job.data.email}:`, error);
        done(error);
    }
});