const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const normalizeEnv = (value) => (typeof value === 'string' ? value.trim() : value);

let cachedTransporter = null;

const getAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
};

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = normalizeEnv(process.env.ZOHO_HOST);
  const port = Number(normalizeEnv(process.env.ZOHO_PORT));
  const user = normalizeEnv(process.env.ZOHO_USER);
  const pass = normalizeEnv(process.env.ZOHO_PASS);

  if (!host || !port || !user || !pass) {
    throw new Error('Missing Zoho SMTP credentials. Set ZOHO_HOST, ZOHO_PORT, ZOHO_USER, ZOHO_PASS.');
  }

  const secureEnv = normalizeEnv(process.env.ZOHO_SECURE);
  const secure = typeof secureEnv === 'string'
    ? ['true', '1', 'yes'].includes(secureEnv.toLowerCase())
    : port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return cachedTransporter;
};

const sendEmail = async ({ to, subject, text, html, attachments, replyTo }) => {
  const transporter = getTransporter();
  const from = normalizeEnv(process.env.ZOHO_FROM) || normalizeEnv(process.env.ZOHO_USER);

  try {
    const info = await transporter.sendMail({
      from,
      to,
      replyTo,
      subject,
      text,
      html,
      attachments
    });
    return { success: true, info };
  } catch (error) {
    console.error('Email send failed', {
      to,
      subject,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message
    });
    throw new Error(error.message || 'Failed to send email.');
  }
};

const sendFreelancingContactEmail = async ({ to, subject, text, attachments, replyTo }) => {
  return sendEmail({ to, subject, text, attachments, replyTo });
};

const getWelcomeImageAttachment = () => {
  const configured = normalizeEnv(process.env.WELCOME_EMAIL_IMAGE_PATH);
  const fallback = path.resolve(__dirname, '../../can.png');
  const resolved = configured || fallback;

  if (!resolved || !fs.existsSync(resolved)) {
    return null;
  }

  return {
    filename: path.basename(resolved),
    path: resolved,
    cid: 'welcome-banner'
  };
};

const sendCandidateWelcomeEmail = async ({
  to,
  candidateName,
  opportunityTitle,
  posterName,
  opportunityType
}) => {
  const subject = 'Welcome to Jankoti.com – Take your first step toward your Job 🚀';
  const displayName = candidateName || 'Candidate';

  const text = `Dear ${displayName},

Welcome to Jankoti.com!
We are delighted to have you join our platform. Jankoti.com offers a comprehensive skill assessment experience that helps you evaluate your abilities, earn certifications, and get intelligently matched with the right organizations based on your skills and performance.
Since this is your first time using the platform, we are here to guide you every step of the way to ensure a smooth and successful journey.

Get Started in 4 Simple Steps
1) Complete Your Profile on https://jankoti.com/
- Please fill in your Profile (Personal details, Email, Phone Number, Education, and Skills)
- Incomplete profiles will not allow you to proceed with the assessment or submit your job application.
2) Take Skill Assessments
- Attempt assessments relevant to your domain and interests.
- Please ensure you finish Psychometrics Test (Mandatory) and 1 Skill Exam to compete in job ranking.
- Score 75% or above to become eligible for the Job Ranking Process.
3) View Your Score & Download Certificate
- After completing the assessment, receive your score and download your skill certificate.
- (Certificates are available for candidates scoring 70% and above.)
- Share your certificate on LinkedIn and social media and tag Jankoti.com to showcase your achievement.
4) Apply for Matching Jobs
- Based on your skills and performance, explore and apply for jobs that best match your profile.

Our mission is to help you showcase your true potential and connect you with the right career opportunities.
If you need any assistance, feel free to reach out to us at support@jankoti.com or visit www.jankoti.com.
Stay updated with job notifications on our WhatsApp Channel:
https://whatsapp.com/channel/0029VbC0L1Z8F2pI4oZSFV0z

Wishing you great success in your career journey!

Warm regards,
Jankoti Support Team
www.jankoti.com

Freelancing and Startup News: https://entrepreneur.jankoti.com/
Startup Cloud: https://flexicloud.co/
Cloud Saving: https://cloudsavvy.io/
`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6;">
      <p>Dear ${displayName},</p>
      <p>Welcome to Jankoti.com!</p>
      <p>
        We are delighted to have you join our platform. Jankoti.com offers a comprehensive skill assessment
        experience that helps you evaluate your abilities, earn certifications, and get intelligently matched
        with the right organizations based on your skills and performance.
      </p>
      <p>Since this is your first time using the platform, we are here to guide you every step of the way to ensure a smooth and successful journey.</p>

      <div style="margin: 18px 0;">
        <h3 style="margin: 0 0 10px; color: #111827;">Get Started in 4 Simple Steps</h3>
        <ol style="padding-left: 18px; margin: 0;">
          <li>
            <strong>Complete Your Profile</strong><br/>
            Complete your profile on <a href="https://jankoti.com/" target="_blank" rel="noopener noreferrer">https://jankoti.com/</a>.<br/>
            &#8226; Please fill in your Profile (Personal details, Email, Phone Number, Education, and Skills)<br/>
            &#8226; Incomplete profiles will not allow you to proceed with the assessment or submit your job application.
          </li>
          <li style="margin-top: 8px;">
            <strong>Take Skill Assessments</strong><br/>
            &#8226; Attempt assessments relevant to your domain and interests.<br/>
            &#8226; Please ensure you finish Psychometrics Test (Mandatory) and 1 Skill Exam to compete in job ranking.<br/>
            &#8226; Score 75% or above to become eligible for the Job Ranking Process.
          </li>
          <li style="margin-top: 8px;">
            <strong>View Your Score & Download Certificate</strong><br/>
            &#8226; After completing the assessment, receive your score and download your skill certificate.<br/>
            &#8226; (Certificates are available for candidates scoring 70% and above.)<br/>
            &#8226; Share your certificate on LinkedIn and social media and tag Jankoti.com to showcase your achievement.
          </li>
          <li style="margin-top: 8px;">
            <strong>Apply for Matching Jobs</strong><br/>
            &#8226; Based on your skills and performance, explore and apply for jobs that best match your profile.
          </li>
        </ol>
      </div>

      <p>Our mission is to help you showcase your true potential and connect you with the right career opportunities.</p>
      <p>If you need any assistance, feel free to reach out to us at <a href="mailto:support@jankoti.com">support@jankoti.com</a> or visit <a href="https://www.jankoti.com" target="_blank" rel="noopener noreferrer">www.jankoti.com</a>.</p>
      <p>Stay updated with job notifications on our WhatsApp Channel:<br/>
        <a href="https://whatsapp.com/channel/0029VbC0L1Z8F2pI4oZSFV0z" target="_blank" rel="noopener noreferrer">Join the WhatsApp Channel</a>
      </p>
      <p>Wishing you great success in your career journey!</p>
      <p>Warm regards,<br/>Jankoti Support Team<br/>www.jankoti.com</p>
      <p>
        Freelancing and Startup News:
        <a href="https://entrepreneur.jankoti.com/" target="_blank" rel="noopener noreferrer">entrepreneur.jankoti.com</a><br/>
        Startup Cloud:
        <a href="https://flexicloud.co/" target="_blank" rel="noopener noreferrer">flexicloud.co</a><br/>
        Cloud Saving:
        <a href="https://cloudsavvy.io/" target="_blank" rel="noopener noreferrer">cloudsavvy.io</a>
      </p>
    </div>
  `;

  const attachment = getWelcomeImageAttachment();
  const attachments = attachment ? [attachment] : undefined;
  const htmlWithImage = attachment
    ? `<div style="margin-bottom: 16px;"><img src="cid:welcome-banner" alt="Jankoti welcome banner" style="max-width: 100%; height: auto; border-radius: 10px;" /></div>${html}`
    : html;

  return sendEmail({
    to,
    subject,
    text,
    html: htmlWithImage,
    attachments
  });
};

const sendRegistrationConfirmation = async ({ to, name }) => {
  const safeName = name || 'there';
  const subject = 'Welcome to Jankoti';
  const text = `Hello ${safeName},\n\nYour account has been created successfully on jankoti.com.\n\nYou can now log in and start using the platform.\n\nBest regards,\nTeam Jankoti\nwww.jankoti.com\n`;
  return sendEmail({ to, subject, text });
};

const sendApplicationNotification = async ({ to, applicantName, jobTitle, profileUrl }) => {
  const subject = `New application for ${jobTitle || 'your job posting'}`;
  const resolvedProfile = (profileUrl || '').trim() || 'Not provided';
  const text = `Hello,\n\nA new application has been submitted for your job posting.\n\nOpportunity: ${jobTitle || 'Job posting'}\nApplicant Name: ${applicantName || 'Candidate'}\nLinkedIn/Profile URL: ${resolvedProfile}\n\nPlease log in to review the application.\n\nBest regards,\nTeam Jankoti\nwww.jankoti.com\n`;
  return sendEmail({ to, subject, text });
};

const sendAdminAlert = async ({ subject, text }) => {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return { success: false, error: 'No admin emails configured.' };
  }
  return sendEmail({ to: adminEmails, subject, text });
};

module.exports = {
  sendFreelancingContactEmail,
  sendCandidateWelcomeEmail,
  sendRegistrationConfirmation,
  sendApplicationNotification,
  sendAdminAlert
};
