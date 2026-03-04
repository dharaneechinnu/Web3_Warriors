require('dotenv').config();
const nodemailer = require('nodemailer');
const { CLIENT_URL } = require('../config/appConfig');

const SENDER_EMAIL = 'dharaneedharanchinnusamy@gmail.com';
const PASS = process.env.PASS;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SENDER_EMAIL, pass: PASS }
});

// ── Styled HTML email wrapper ──────────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:2rem auto;background:#1e293b;border-radius:1rem;overflow:hidden;border:1px solid #334155;">
  <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:1.5rem 2rem;">
    <h1 style="color:#fff;margin:0;font-size:1.4rem;">🤝 Skill Exchange Mentorship</h1>
  </div>
  <div style="padding:2rem;color:#e2e8f0;line-height:1.7;">
    ${body}
  </div>
  <div style="padding:1rem 2rem;background:rgba(0,0,0,0.2);text-align:center;font-size:0.8rem;color:#64748b;">
    Skill Exchange Platform · 1-on-1 Mentorship
  </div>
</div>
</body>
</html>`;

// ── Send booking request email to mentor ──────────────────────────────────
exports.sendBookingRequestEmail = async ({ mentorEmail, mentorName, learnerName, topic, date, duration, message }) => {
    try {
        const fmtDate = new Date(date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
        const html = wrap(`
            <h2 style="color:#f59e0b;margin:0 0 1rem;">📬 New Mentorship Booking Request</h2>
            <p>Hello <strong style="color:#fff;">${mentorName}</strong>,</p>
            <p>A learner has requested a 1-on-1 mentorship session with you.</p>
            <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:0.75rem;padding:1.25rem;margin:1rem 0;">
                <table style="width:100%;border-collapse:collapse;color:#e2e8f0;">
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Learner</td><td style="text-align:right;font-weight:700;">${learnerName}</td></tr>
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Topic</td><td style="text-align:right;font-weight:700;">${topic}</td></tr>
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Requested Time</td><td style="text-align:right;font-weight:700;color:#f59e0b;">${fmtDate}</td></tr>
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Duration</td><td style="text-align:right;">${duration} min</td></tr>
                    ${message ? `<tr><td style="padding:0.3rem 0;color:#94a3b8;">Message</td><td style="text-align:right;font-style:italic;">"${message}"</td></tr>` : ''}
                </table>
            </div>
            <p>Please log in to your dashboard to <strong>Accept</strong> or <strong>Decline</strong> this request.</p>
            <div style="text-align:center;margin:1.5rem 0;">
                <a href="${CLIENT_URL}/mentor/sessions" style="display:inline-block;padding:0.75rem 2rem;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem;">Open Dashboard →</a>
            </div>
        `);

        await transporter.sendMail({
            from: SENDER_EMAIL,
            to: mentorEmail,
            subject: `📬 New Mentorship Booking Request from ${learnerName}`,
            html
        });
        console.log(`[Email] Booking request sent to ${mentorEmail}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send booking request email:', err.message);
        return false;
    }
};

// ── Send acceptance email to learner ──────────────────────────────────────
exports.sendBookingAcceptedEmail = async ({ learnerEmail, learnerName, mentorName, topic, scheduledAt, duration, roomId }) => {
    try {
        const fmtDate = new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
        const html = wrap(`
            <h2 style="color:#22c55e;margin:0 0 1rem;">✅ Mentorship Session Confirmed!</h2>
            <p>Hello <strong style="color:#fff;">${learnerName}</strong>,</p>
            <p>Great news! <strong>${mentorName}</strong> has accepted your mentorship request.</p>
            <div style="background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.3);border-radius:0.75rem;padding:1.25rem;margin:1rem 0;">
                <table style="width:100%;border-collapse:collapse;color:#e2e8f0;">
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Mentor</td><td style="text-align:right;font-weight:700;">${mentorName}</td></tr>
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Topic</td><td style="text-align:right;font-weight:700;">${topic}</td></tr>
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Scheduled</td><td style="text-align:right;font-weight:700;color:#06b6d4;">${fmtDate}</td></tr>
                    <tr><td style="padding:0.3rem 0;color:#94a3b8;">Duration</td><td style="text-align:right;">${duration} min</td></tr>
                </table>
            </div>
            <p>A private video room has been created. Join at the scheduled time:</p>
            <div style="text-align:center;margin:1.5rem 0;">
                <a href="${CLIENT_URL}/room/${roomId}" style="display:inline-block;padding:0.75rem 2rem;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem;">📹 Join Video Room</a>
            </div>
        `);

        await transporter.sendMail({
            from: SENDER_EMAIL,
            to: learnerEmail,
            subject: `✅ Mentorship Confirmed with ${mentorName} — ${topic}`,
            html
        });
        console.log(`[Email] Booking accepted sent to ${learnerEmail}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send accepted email:', err.message);
        return false;
    }
};

// ── Send rejection email to learner ───────────────────────────────────────
exports.sendBookingRejectedEmail = async ({ learnerEmail, learnerName, mentorName, topic, reason }) => {
    try {
        const html = wrap(`
            <h2 style="color:#ef4444;margin:0 0 1rem;">❌ Mentorship Request Declined</h2>
            <p>Hello <strong style="color:#fff;">${learnerName}</strong>,</p>
            <p>Unfortunately, <strong>${mentorName}</strong> was unable to accept your mentorship request for <strong>"${topic}"</strong>.</p>
            ${reason ? `<p style="color:#94a3b8;font-style:italic;">Reason: "${reason}"</p>` : ''}
            <p>Don't worry! You can browse other mentors and book a new session.</p>
            <div style="text-align:center;margin:1.5rem 0;">
                <a href="${CLIENT_URL}/sessions" style="display:inline-block;padding:0.75rem 2rem;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem;">Browse Mentors →</a>
            </div>
        `);

        await transporter.sendMail({
            from: SENDER_EMAIL,
            to: learnerEmail,
            subject: `Mentorship request for "${topic}" was declined`,
            html
        });
        console.log(`[Email] Booking rejected sent to ${learnerEmail}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send rejected email:', err.message);
        return false;
    }
};

// ── Send mentor rejection email (when admin rejects application) ───────────
exports.sendMentorRejectionEmail = async ({ mentorEmail, mentorName, reason }) => {
    try {
        const html = wrap(`
            <h2 style="color:#ef4444;margin:0 0 1rem;">Application Update — Thank You for Applying</h2>
            <p>Hello <strong style="color:#fff;">${mentorName}</strong>,</p>
            <p>Thank you for your interest in becoming a mentor on the Skill Exchange platform and for taking the time to submit your application.</p>
            <p>After careful review, we have decided not to move forward with your application at this time.</p>
            ${reason ? `<p style="color:#94a3b8;font-style:italic;">Reason provided by reviewer: ${reason}</p>` : ''}
            <p>We appreciate the effort you put into your submission. If you would like to improve your application and reapply in the future, consider:</p>
            <ul style="color:#e2e8f0;">
                <li>Providing more details on recent projects and outcomes</li>
                <li>Highlighting specific mentoring or teaching experience</li>
                <li>Uploading a concise intro video demonstrating your communication style</li>
            </ul>
            <p>If you have questions or would like feedback, please reply to this email and our team will assist where possible.</p>
            <p style="margin-top:1rem;">Warm regards,<br/>The Skill Exchange Team</p>
            <div style="text-align:center;margin:1.5rem 0;">
                <a href="${CLIENT_URL}/" style="display:inline-block;padding:0.5rem 1.25rem;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;">Visit Skill Exchange</a>
            </div>
        `);

        await transporter.sendMail({
            from: SENDER_EMAIL,
            to: mentorEmail,
            subject: `Update on your mentor application`,
            html,
        });

        console.log(`[Email] Mentor rejection sent to ${mentorEmail}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send mentor rejection email:', err.message);
        return false;
    }
};

// ── Send mentor approval email (when admin approves application) ───────────
exports.sendMentorApprovalEmail = async ({ mentorEmail, mentorName }) => {
    try {
        const html = wrap(`
            <h2 style="color:#22c55e;margin:0 0 1rem;">Congratulations — Mentor Application Approved</h2>
            <p>Hello <strong style="color:#fff;">${mentorName}</strong>,</p>
            <p>We're excited to let you know that your application to join Skill Exchange as a mentor has been approved.</p>
            <p>You now have access to mentor features including creating courses, accepting sessions, and managing learners.</p>
            <div style="background:rgba(6,182,212,0.04);border-radius:0.5rem;padding:1rem;margin:1rem 0;color:#e2e8f0;">
                <p style="margin:0;">Next steps:</p>
                <ul style="margin:0.5rem 0 0;color:#e2e8f0;">
                    <li>Log in to your mentor dashboard and complete your profile.</li>
                    <li>Set up your availability and create your first session.</li>
                    <li>Upload any course materials or an intro video to help learners find you.</li>
                </ul>
            </div>
            <p>If you have any questions, reply to this email and our team will assist.</p>
            <p style="margin-top:1rem;">Warm regards,<br/>The Skill Exchange Team</p>
            <div style="text-align:center;margin:1.5rem 0;">
                <a href="${CLIENT_URL}/mentor/dashboard" style="display:inline-block;padding:0.5rem 1.25rem;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;">Open Mentor Dashboard</a>
            </div>
        `);

        await transporter.sendMail({
            from: SENDER_EMAIL,
            to: mentorEmail,
            subject: `Your mentor application has been approved`,
            html,
        });

        console.log(`[Email] Mentor approval sent to ${mentorEmail}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send mentor approval email:', err.message);
        return false;
    }
};
