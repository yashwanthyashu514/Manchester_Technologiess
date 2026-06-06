import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter from environment variables
const createTransporter = () => {
  // If SMTP configurations are not present, log a warning and return null
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not found in environment variables. Email notifications will be simulated (printed to logs).');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Common Email Style Wrapper (Manchester Tech theme: Gold & Dark Silver)
const wrapHtmlEmail = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f0f0f;
      color: #e0e0e0;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #1a1a1a;
      border: 1px solid #C8A96A;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      background-color: #0d0d0d;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 2px solid #C8A96A;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .logo span {
      color: #C8A96A;
    }
    .content {
      padding: 30px 20px;
      line-height: 1.6;
    }
    .title {
      font-size: 20px;
      color: #C8A96A;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 600;
      border-left: 4px solid #C8A96A;
      padding-left: 10px;
    }
    .section-title {
      font-size: 16px;
      color: #C8A96A;
      margin: 25px 0 10px 0;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid rgba(200, 169, 106, 0.2);
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    td {
      padding: 8px 0;
      vertical-align: top;
    }
    .label {
      width: 35%;
      color: #A0A0A0;
      font-weight: 500;
    }
    .value {
      width: 65%;
      color: #ffffff;
    }
    .highlight-box {
      background-color: #242424;
      border: 1px dashed rgba(200, 169, 106, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C8A96A;
      color: #0d0d0d !important;
      text-decoration: none;
      padding: 12px 25px;
      font-weight: bold;
      border-radius: 6px;
      margin-top: 20px;
      text-align: center;
    }
    .btn:hover {
      background-color: #D4B87A;
    }
    .footer {
      background-color: #0d0d0d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b6b6b;
      border-top: 1px solid #222;
    }
    .footer a {
      color: #C8A96A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Manchester<span>Tech</span></div>
    </div>
    <div class="content">
      <h2 class="title">${title}</h2>
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated notification from Manchester Technologies.</p>
      <p>&copy; ${new Date().getFullYear()} Manchester Technologies. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends a notification email to the admin with candidate details and attachments.
 */
export const sendAdminNotification = async (app) => {
  const adminEmail = 'manchestertechnologiess@gmail.com';
  const subject = `New Internship Application | ${app.full_name} | ${app.preferred_duration}`;
  
  const bodyHtml = wrapHtmlEmail(
    'New Application Received',
    `
    <p>A new candidate has submitted an application for the internship program.</p>
    
    <div class="highlight-box">
      <strong>Application ID:</strong> ${app.application_id}<br/>
      <strong>Submitted On:</strong> ${app.created_at.split('T')[0]} at ${app.created_at.split('T')[1]?.substring(0, 8) || ''} (IP: ${app.ip_address || 'N/A'})
    </div>
    
    <div class="section-title">Personal Details</div>
    <table>
      <tr><td class="label">Full Name</td><td class="value">${app.full_name}</td></tr>
      <tr><td class="label">Email</td><td class="value">${app.email}</td></tr>
      <tr><td class="label">Phone</td><td class="value">${app.phone}</td></tr>
      <tr><td class="label">Date of Birth</td><td class="value">${app.dob}</td></tr>
      <tr><td class="label">Gender</td><td class="value">${app.gender}</td></tr>
      <tr><td class="label">Location</td><td class="value">${app.city}, ${app.state}</td></tr>
      <tr><td class="label">Address</td><td class="value">${app.address}</td></tr>
    </table>

    <div class="section-title">Academic Details</div>
    <table>
      <tr><td class="label">College</td><td class="value">${app.college_name}</td></tr>
      <tr><td class="label">University</td><td class="value">${app.university_name}</td></tr>
      <tr><td class="label">Branch</td><td class="value">${app.department}</td></tr>
      <tr><td class="label">Semester / Year</td><td class="value">Semester ${app.semester} (Grad Year: ${app.graduation_year})</td></tr>
      <tr><td class="label">CGPA / %</td><td class="value">${app.cgpa}</td></tr>
    </table>

    <div class="section-title">Professional Details</div>
    <table>
      <tr><td class="label">Skills</td><td class="value">${app.skills}</td></tr>
      <tr><td class="label">Technologies</td><td class="value">${app.technologies_known}</td></tr>
      <tr><td class="label">Languages</td><td class="value">${app.programming_languages}</td></tr>
      <tr><td class="label">GitHub</td><td class="value"><a href="${app.github_profile}" style="color:#C8A96A;" target="_blank">${app.github_profile || 'N/A'}</a></td></tr>
      <tr><td class="label">LinkedIn</td><td class="value"><a href="${app.linkedin_profile}" style="color:#C8A96A;" target="_blank">${app.linkedin_profile || 'N/A'}</a></td></tr>
      <tr><td class="label">Portfolio</td><td class="value"><a href="${app.portfolio_url}" style="color:#C8A96A;" target="_blank">${app.portfolio_url || 'N/A'}</a></td></tr>
    </table>

    <div class="section-title">Internship Preferences</div>
    <table>
      <tr><td class="label">Domain</td><td class="value" style="font-weight:bold; color:#C8A96A;">${app.preferred_domain}</td></tr>
      <tr><td class="label">Duration</td><td class="value">${app.preferred_duration}</td></tr>
      <tr><td class="label">Start Date</td><td class="value">${app.start_date}</td></tr>
    </table>

    <div class="section-title">Questionnaire Answers</div>
    <p><strong>1. Why do you want this internship?</strong><br/><span style="color:#ffffff;">${app.q_why_internship}</span></p>
    <p><strong>2. What technologies do you know best?</strong><br/><span style="color:#ffffff;">${app.q_tech_best}</span></p>
    <p><strong>3. Describe your best project.</strong><br/><span style="color:#ffffff;">${app.q_best_project}</span></p>
    <p><strong>4. How many hours per day can you dedicate?</strong><br/><span style="color:#ffffff;">${app.q_hours_per_day}</span></p>
    <p><strong>5. Why should we select you?</strong><br/><span style="color:#ffffff;">${app.q_why_select}</span></p>
    <p><strong>6. What are your career goals?</strong><br/><span style="color:#ffffff;">${app.q_career_goals}</span></p>

    <div class="section-title">Confidentiality Agreement</div>
    <p style="color:#C8A96A; font-weight:500;">✓ Applicant has accepted all confidentiality agreement terms.</p>
    `
  );

  // Prepare attachments
  const attachments = [];
  if (app.resume_path && fs.existsSync(app.resume_path)) {
    attachments.push({
      filename: path.basename(app.resume_path),
      path: app.resume_path
    });
  }
  if (app.portfolio_path && fs.existsSync(app.portfolio_path)) {
    attachments.push({
      filename: path.basename(app.portfolio_path),
      path: app.portfolio_path
    });
  }
  if (app.docs_path && fs.existsSync(app.docs_path)) {
    attachments.push({
      filename: path.basename(app.docs_path),
      path: app.docs_path
    });
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Sending Admin Email to ${adminEmail} for application ${app.application_id}. Attachments:`, attachments.map(a => a.filename));
    return true; // Simulate success
  }

  await transporter.sendMail({
    from: `"Manchester Tech Portal" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: subject,
    html: bodyHtml,
    attachments: attachments
  });
  return true;
};

/**
 * Sends a confirmation email to the applicant.
 */
export const sendApplicantConfirmation = async (app) => {
  const subject = `Application Received - Manchester Technologies Internship Program`;
  
  const bodyHtml = wrapHtmlEmail(
    'Application Received',
    `
    <p>Dear <strong>${app.full_name}</strong>,</p>
    
    <p>Thank you for applying for the internship program at Manchester Technologies! We have received your application and will review it shortly.</p>
    
    <div class="highlight-box">
      <strong>Your Application ID:</strong> ${app.application_id}<br/>
      <strong>Preferred Domain:</strong> ${app.preferred_domain}<br/>
      <strong>Preferred Duration:</strong> ${app.preferred_duration}<br/>
      <strong>Submitted On:</strong> ${app.created_at.split('T')[0]}
    </div>
    
    <h3>What are the next steps?</h3>
    <ol>
      <li>Our HR & Technical teams will review your academic and professional profiles.</li>
      <li>If shortlisted, you will receive an invitation email to schedule your interview (online or offline).</li>
      <li>You can track the live status of your application at any time using our status portal by clicking the button below.</li>
    </ol>

    <div style="text-align: center;">
      <a href="${process.env.PORTAL_URL || 'http://localhost:5173'}/internships/status" class="btn">Track Application Status</a>
    </div>

    <p style="margin-top: 30px;">Best Regards,<br/><strong>Manchester Technologies Recruitment Team</strong></p>
    `
  );

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Sending Applicant Email to ${app.email} for application ${app.application_id}.`);
    return true;
  }

  await transporter.sendMail({
    from: `"Manchester Technologies" <${process.env.SMTP_USER}>`,
    to: app.email,
    subject: subject,
    html: bodyHtml
  });
  return true;
};

/**
 * Sends an interview schedule email to the applicant.
 */
export const sendInterviewInvitation = async (app, interview) => {
  const subject = `Interview Scheduled - Manchester Technologies Internship Program`;
  
  const bodyHtml = wrapHtmlEmail(
    'Interview Invitation',
    `
    <p>Dear <strong>${app.full_name}</strong>,</p>
    
    <p>Great news! Your application has been shortlisted and an interview has been scheduled for you.</p>
    
    <div class="highlight-box">
      <strong>Interview Date:</strong> ${interview.interview_date}<br/>
      <strong>Interview Time:</strong> ${interview.interview_time}<br/>
      <strong>Venue:</strong> ${interview.venue}<br/>
      ${interview.online_link ? `<strong>Online Link:</strong> <a href="${interview.online_link}" style="color:#C8A96A;" target="_blank">${interview.online_link}</a><br/>` : ''}
    </div>

    ${interview.instructions ? `
      <h3>Special Instructions:</h3>
      <p style="background-color: #242424; padding: 12px; border-radius: 6px; border-left: 3px solid #C8A96A;">${interview.instructions}</p>
    ` : ''}

    <p>Please log in to the status tracking page to confirm these details at any time.</p>

    <div style="text-align: center;">
      <a href="${process.env.PORTAL_URL || 'http://localhost:5173'}/internships/status" class="btn">Track Details</a>
    </div>

    <p style="margin-top: 30px;">Best Regards,<br/><strong>Manchester Technologies Technical Board</strong></p>
    `
  );

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[SIMULATION] Sending Interview Email to ${app.email} for application ${app.application_id}.`);
    return true;
  }

  await transporter.sendMail({
    from: `"Manchester Technologies" <${process.env.SMTP_USER}>`,
    to: app.email,
    subject: subject,
    html: bodyHtml
  });
  return true;
};
