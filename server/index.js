import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PDFDocument as LibPDFDocument } from 'pdf-lib';

import {
  initDb,
  dbRun,
  dbGet,
  dbQuery
} from './database.js';
import {
  sendAdminNotification,
  sendApplicantConfirmation,
  sendInterviewInvitation
} from './email.js';
import {
  authenticate,
  requireAdmin,
  requireInternOrAdmin,
  generateToken
} from './auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with Credentials
app.use(cors({
  origin: true, // Allow all origins for dev
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload folder exists
const isVercel = !!process.env.VERCEL;
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const CERTS_DIR = isVercel ? '/tmp/certificates' : path.join(__dirname, 'certificates');

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique temp name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer file validation (Accepts PDF, DOC, DOCX, maximum 5MB)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, DOC, and DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API Routes

// Initialize Database on startup
initDb().then(() => {
  console.log('Database initialized successfully.');
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// Helper: Generate PDF Certificate
const generateCertificatePDF = async (cert, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Fill Background Dark
      doc.save();
      doc.rect(0, 0, 842, 595).fill('#0D0D0D');
      doc.restore();

      // Golden Borders
      doc.rect(30, 30, 782, 535)
         .lineWidth(4)
         .stroke('#C8A96A');

      doc.rect(38, 38, 766, 519)
         .lineWidth(1)
         .stroke('#A68B4F');

      // Brand Header
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(32)
         .text('MANCHESTER TECHNOLOGIES', 40, 75, { align: 'center' });

      doc.fillColor('#C8A96A')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('INTERNSHIP COMPLETION CERTIFICATE', 40, 120, { align: 'center', characterSpacing: 2 });

      // Certificate Body Text
      doc.fillColor('#A0A0A0')
         .font('Helvetica')
         .fontSize(14)
         .text('This is to certify that', 40, 185, { align: 'center' });

      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(28)
         .text(cert.candidate_name, 40, 215, { align: 'center' });

      doc.fillColor('#A0A0A0')
         .font('Helvetica')
         .fontSize(14)
         .text(`has successfully completed a ${cert.duration} Internship Program in the domain of`, 40, 260, { align: 'center' });

      doc.fillColor('#C8A96A')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text(cert.domain, 40, 290, { align: 'center' });

      doc.fillColor('#A0A0A0')
         .font('Helvetica')
         .fontSize(14)
         .text(`at Manchester Technologies from ${cert.start_date} to ${cert.end_date}.`, 40, 335, { align: 'center' });

      doc.text('During this period, their performance was reviewed and found to be outstanding.', 40, 365, { align: 'center' });

      // Signatures
      doc.strokeColor('rgba(200, 169, 106, 0.3)')
         .lineWidth(1)
         .moveTo(100, 480)
         .lineTo(280, 480)
         .stroke();

      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('MANAGING DIRECTOR', 100, 490, { width: 180, align: 'center' });

      // QR Verification Code
      const verifyUrl = `${process.env.PORTAL_URL || 'http://localhost:5173'}/internships/verify-certificate/${cert.certificate_number}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        color: {
          dark: '#C8A96A',
          light: '#0D0D0D'
        },
        width: 100,
        margin: 1
      });
      
      const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrImageBuffer, 371, 410, { width: 100 });

      doc.fillColor('#A0A0A0')
         .font('Helvetica')
         .fontSize(9)
         .text('SCAN TO VERIFY CERTIFICATE', 320, 520, { width: 202, align: 'center' });

      // HR Signature
      doc.strokeColor('rgba(200, 169, 106, 0.3)')
         .lineWidth(1)
         .moveTo(560, 480)
         .lineTo(740, 480)
         .stroke();

      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('HR MANAGER', 560, 490, { width: 180, align: 'center' });

      doc.fillColor('#6B6B6B')
         .font('Helvetica')
         .fontSize(10)
         .text(`Certificate No: ${cert.certificate_number}`, 40, 550, { align: 'left' })
         .text(`Date of Issue: ${new Date().toISOString().split('T')[0]}`, 40, 550, { align: 'right' });

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

/* =========================================================================
   PUBLIC / CANDIDATE ENDPOINTS
   ========================================================================= */

// Submit Internship Application
app.post('/api/internships/apply', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
  { name: 'docs', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check files presence
    if (!req.files || !req.files['resume']) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    // Generate unique Application ID (MTYYYYNNNN)
    const year = new Date().getFullYear();
    const row = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE application_id LIKE ?`, [`MT${year}%`]);
    let count = (row ? row.count : 0) + 1;
    let application_id;
    while (true) {
      application_id = `MT${year}${String(count).padStart(4, '0')}`;
      const exists = await dbGet(`SELECT id FROM applications WHERE application_id = ?`, [application_id]);
      if (!exists) break;
      count++;
    }

    // Move / rename files to secure names based on Application ID
    const resumeFile = req.files['resume'][0];
    const resumeExt = path.extname(resumeFile.originalname);
    const resumePath = path.join(UPLOADS_DIR, `${application_id}_resume${resumeExt}`);
    fs.renameSync(resumeFile.path, resumePath);

    let portfolioPath = null;
    if (req.files['portfolio']) {
      const portfolioFile = req.files['portfolio'][0];
      const portfolioExt = path.extname(portfolioFile.originalname);
      portfolioPath = path.join(UPLOADS_DIR, `${application_id}_portfolio${portfolioExt}`);
      fs.renameSync(portfolioFile.path, portfolioPath);
    }

    let docsPath = null;
    if (req.files['docs']) {
      const docsFile = req.files['docs'][0];
      const docsExt = path.extname(docsFile.originalname);
      docsPath = path.join(UPLOADS_DIR, `${application_id}_docs${docsExt}`);
      fs.renameSync(docsFile.path, docsPath);
    }

    // Read uploaded files into Base64 strings for database persistence in ephemeral serverless environments
    const resumeData = fs.readFileSync(resumePath).toString('base64');
    let portfolioData = null;
    if (portfolioPath) {
      portfolioData = fs.readFileSync(portfolioPath).toString('base64');
    }
    let docsData = null;
    if (docsPath) {
      docsData = fs.readFileSync(docsPath).toString('base64');
    }

    const created_at = new Date().toISOString();

    // Insert Application into DB using prepared statements
    const sql = `
      INSERT INTO applications (
        application_id, full_name, email, phone, dob, gender, city, state, address,
        college_name, university_name, department, semester, graduation_year, cgpa,
        skills, technologies_known, programming_languages, github_profile, linkedin_profile, portfolio_url,
        preferred_domain, preferred_duration, start_date, resume_path, portfolio_path, docs_path,
        q_why_internship, q_tech_best, q_best_project, q_hours_per_day, q_why_select, q_career_goals,
        conf_agreement_1, conf_agreement_2, conf_agreement_3, conf_agreement_4,
        created_at, updated_at, ip_address, status,
        country, degree, branch, certifications, previous_experience, experience_description, additional_comments,
        resume_data, portfolio_data, docs_data
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        1, 1, 1, 1,
        ?, ?, ?, 'Submitted',
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `;

    const params = [
      application_id, data.full_name, data.email, data.phone, data.dob, data.gender, data.city, data.state, data.address,
      data.college_name, data.university_name, data.department, data.semester, parseInt(data.graduation_year) || 0, data.cgpa,
      data.skills, data.technologies_known, data.programming_languages, data.github_profile, data.linkedin_profile, data.portfolio_url,
      data.preferred_domain, data.preferred_duration, data.start_date, resumePath, portfolioPath, docsPath,
      data.q_why_internship, data.q_tech_best, data.q_best_project, data.q_hours_per_day, data.q_why_select, data.q_career_goals,
      created_at, created_at, ipAddress,
      data.country, data.degree, data.branch, data.certifications, data.previous_experience, data.experience_description, data.additional_comments,
      resumeData, portfolioData, docsData
    ];

    await dbRun(sql, params);


    // Fetch the newly inserted application record
    const application = await dbGet(`SELECT * FROM applications WHERE application_id = ?`, [application_id]);

    // Attempt to send Emails
    let email_sent = 0;
    let email_error = null;
    try {
      await sendAdminNotification(application);
      await sendApplicantConfirmation(application);
      email_sent = 1;
      await dbRun(`UPDATE applications SET email_notification_sent = 1 WHERE application_id = ?`, [application_id]);
    } catch (mailErr) {
      email_error = mailErr.message || 'SMTP transmission failure';
      console.error('Mailer failed on submission:', mailErr);
      await dbRun(
        `UPDATE applications SET email_notification_sent = 0, email_notification_error = ? WHERE application_id = ?`,
        [email_error, application_id]
      );
    }

    return res.status(201).json({
      success: true,
      application_id: application_id,
      email_notification_sent: email_sent,
      email_notification_error: email_error
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'Failed to process application. Please try again.' });
  }
});

// View application status tracking
app.post('/api/internships/status', async (req, res) => {
  const { email, application_id } = req.body;
  if (!email || !application_id) {
    return res.status(400).json({ error: 'Email and Application ID are required.' });
  }

  try {
    const app = await dbGet(
      `SELECT application_id, full_name, email, preferred_domain, preferred_duration, status, created_at, updated_at, termsAccepted, signedAt 
       FROM applications WHERE LOWER(email) = LOWER(?) AND application_id = ?`, 
      [email.trim(), application_id.trim()]
    );

    if (!app) {
      return res.status(404).json({ error: 'No application found with the provided Email Address and Application ID.' });
    }

    // Fetch details based on status
    let interviewDetails = null;
    let projectDetails = null;
    let certificateDetails = null;

    if (app.status === 'Interview Scheduled') {
      interviewDetails = await dbGet(`SELECT * FROM interviews WHERE application_id = ?`, [app.application_id]);
    }

    if (['Selected', 'Active Intern', 'Completed'].includes(app.status)) {
      projectDetails = await dbGet(`SELECT * FROM project_assignments WHERE application_id = ?`, [app.application_id]);
    }

    if (app.status === 'Completed') {
      certificateDetails = await dbGet(`SELECT * FROM certificates WHERE application_id = ?`, [app.application_id]);
    }

    return res.json({
      application: app,
      interview: interviewDetails,
      project: projectDetails,
      certificate: certificateDetails
    });

  } catch (error) {
    console.error('Error fetching application status:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Verify Certificate (Public Route)
app.get('/api/internships/verify-certificate/:certificateNumber', async (req, res) => {
  const { certificateNumber } = req.params;
  try {
    const cert = await dbGet(`SELECT * FROM certificates WHERE certificate_number = ?`, [certificateNumber]);
    if (!cert) {
      return res.status(404).json({ error: 'Invalid Certificate Number. Verification failed.' });
    }
    return res.json({ success: true, certificate: cert });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal verification error.' });
  }
});

// SMTP Test Diagnostic Endpoint (Admin use only)
app.get('/api/test-smtp', async (req, res) => {
  const nodemailer = await import('nodemailer');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  if (!smtpUser || !smtpPass) {
    return res.json({ success: false, error: 'SMTP credentials missing from environment variables.', SMTP_USER: smtpUser || 'NOT SET', SMTP_PASS: smtpPass ? '***SET***' : 'NOT SET' });
  }

  try {
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.verify();
    return res.json({ success: true, message: 'SMTP connection verified successfully! Emails will work.', SMTP_USER: smtpUser, SMTP_HOST: smtpHost, SMTP_PORT: smtpPort });
  } catch (err) {
    return res.json({ success: false, error: err.message, SMTP_USER: smtpUser, SMTP_HOST: smtpHost });
  }
});


/* =========================================================================
   TERMS & CONDITIONS & DIGITAL SIGNATURE ENDPOINTS
   ========================================================================= */

// Normalizer to map lowercase keys (PostgreSQL default) to camelCase keys (SQLite / Frontend default)
const normalizeAppKeys = (app) => {
  if (!app) return app;
  const normalized = { ...app };
  const keyMappings = {
    termsaccepted: 'termsAccepted',
    signedat: 'signedAt',
    signatureimage: 'signatureImage',
    signedpdfgenerated: 'signedPdfGenerated',
    signatureauditlog: 'signatureAuditLog',
    browserinfo: 'browserInfo',
    deviceinfo: 'deviceInfo',
    ipaddress: 'ipAddress',
    signedpdfversion: 'signedPdfVersion'
  };
  for (const [pgKey, camelKey] of Object.entries(keyMappings)) {
    if (app[pgKey] !== undefined && app[camelKey] === undefined) {
      normalized[camelKey] = app[pgKey];
    }
  }
  return normalized;
};

// Helper: Generate Signed Agreement PDF
// Helper: Generate Signed Agreement PDF using pdf-lib (strictly dynamic)
const generateSignedAgreementPDF = async (appData, outputPath) => {
  try {
    const pdfPath = path.join(__dirname, '..', 'public', 'manchestertechnologiestandc.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error('Original Terms & Conditions PDF file not found.');
    }
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await LibPDFDocument.load(existingPdfBytes);

    // Add a blank page for signature block
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont('Helvetica-Bold');
    const fontRegular = await pdfDoc.embedFont('Helvetica');
    const fontOblique = await pdfDoc.embedFont('Helvetica-Oblique');

    const drawHeader = () => {
      page.drawRectangle({
        x: 0,
        y: height - 15,
        width: width,
        height: 15,
        color: rgb(200 / 255, 169 / 255, 106 / 255)
      });
      page.drawText('MANCHESTER TECHNOLOGIES', {
        x: 50,
        y: height - 35,
        size: 10,
        font: fontBold,
        color: rgb(26 / 255, 26 / 255, 26 / 255)
      });
      page.drawText(`Signed Internship Agreement | Page ${pdfDoc.getPageCount()}`, {
        x: width - 210,
        y: height - 35,
        size: 8,
        font: fontRegular,
        color: rgb(85 / 255, 85 / 255, 85 / 255)
      });
      page.drawLine({
        start: { x: 50, y: height - 42 },
        end: { x: width - 50, y: height - 42 },
        thickness: 0.5,
        color: rgb(229 / 255, 229 / 255, 229 / 255)
      });
    };

    const drawFooter = () => {
      page.drawLine({
        start: { x: 50, y: 55 },
        end: { x: width - 50, y: 55 },
        thickness: 0.5,
        color: rgb(229 / 255, 229 / 255, 229 / 255)
      });
      page.drawText(`Verified Secure Digital Signature Agreement. Application ID: ${appData.application_id}`, {
        x: 100,
        y: 42,
        size: 8,
        font: fontRegular,
        color: rgb(85 / 255, 85 / 255, 85 / 255)
      });
    };

    drawHeader();

    page.drawText('CANDIDATE SIGNATURE & RECORD OF ACCEPTANCE', {
      x: 140,
      y: height - 75,
      size: 13,
      font: fontBold,
      color: rgb(200 / 255, 169 / 255, 106 / 255)
    });

    page.drawRectangle({
      x: 50,
      y: height - 250,
      width: width - 100,
      height: 155,
      borderColor: rgb(200 / 255, 169 / 255, 106 / 255),
      borderWidth: 1
    });

    const drawDetailRow = (label, val, yVal) => {
      page.drawText(label, { x: 70, y: yVal, size: 9, font: fontBold });
      page.drawText(val, { x: 200, y: yVal, size: 9, font: fontRegular });
    };

    drawDetailRow('Candidate Name:', appData.full_name || 'N/A', height - 120);
    drawDetailRow('Candidate Email:', appData.email || 'N/A', height - 140);
    drawDetailRow('Application ID:', appData.application_id || 'N/A', height - 160);
    drawDetailRow('Date of Signing:', new Date(appData.signedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), height - 180);
    drawDetailRow('Status:', 'Terms & Conditions Accepted', height - 200);
    drawDetailRow('Signed Version:', appData.signedPdfVersion || 'manchestertechnologiestandc.pdf', height - 220);

    page.drawText('Acceptance Statement:', {
      x: 50,
      y: height - 275,
      size: 10,
      font: fontBold
    });
    page.drawText('"I confirm that I have read and accepted all Terms & Conditions of Manchester Technologies Internship Program."', {
      x: 50,
      y: height - 295,
      size: 9,
      font: fontOblique,
      color: rgb(85 / 255, 85 / 255, 85 / 255)
    });

    page.drawText('Digital Signature (Drawn):', {
      x: 50,
      y: height - 325,
      size: 10,
      font: fontBold
    });

    if (appData.signatureImage) {
      const base64Data = appData.signatureImage.replace(/^data:image\/png;base64,/, "");
      const sigBuffer = Buffer.from(base64Data, 'base64');
      const signatureImage = await pdfDoc.embedPng(sigBuffer);
      
      page.drawRectangle({
        x: 150,
        y: height - 480,
        width: 300,
        height: 120,
        borderColor: rgb(229 / 255, 229 / 255, 229 / 255),
        borderWidth: 0.5
      });

      page.drawImage(signatureImage, {
        x: 155,
        y: height - 475,
        width: 290,
        height: 110
      });
    } else {
      page.drawText('No signature captured', {
        x: 150,
        y: height - 360,
        size: 9,
        font: fontOblique,
        color: rgb(85 / 255, 85 / 255, 85 / 255)
      });
    }

    page.drawRectangle({
      x: 50,
      y: 80,
      width: width - 100,
      height: 110,
      borderColor: rgb(229 / 255, 229 / 255, 229 / 255),
      borderWidth: 0.5
    });

    page.drawText('Security Audit Logs:', {
      x: 60,
      y: 175,
      size: 9,
      font: fontBold
    });

    const drawAuditRow = (label, val, yVal) => {
      page.drawText(label, { x: 60, y: yVal, size: 8, font: fontBold, color: rgb(85 / 255, 85 / 255, 85 / 255) });
      const valStr = String(val).substring(0, 85);
      page.drawText(valStr, { x: 140, y: yVal, size: 8, font: fontRegular, color: rgb(85 / 255, 85 / 255, 85 / 255) });
    };

    drawAuditRow('Browser Agent:', appData.browserInfo || 'N/A', 155);
    drawAuditRow('Device Profile:', appData.deviceInfo || 'N/A', 135);
    drawAuditRow('Logged IP:', appData.ipAddress || 'N/A', 115);
    drawAuditRow('Security Hash:', `SECURE_LEDGER_CONFIRMED_${appData.application_id}`, 95);

    drawFooter();

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
  } catch (err) {
    console.error('pdf-lib generation failed:', err);
    throw err;
  }
};

// Check T&C Acceptance Eligibility
app.post('/api/internships/verify-tc-eligibility', async (req, res) => {
  const { email, application_id } = req.body;
  if (!email || !application_id) {
    return res.status(400).json({ error: 'Email and Application ID are required.' });
  }

  try {
    const app = await dbGet(
      `SELECT id, application_id, full_name, email, status, termsAccepted, signedAt 
       FROM applications WHERE LOWER(email) = LOWER(?) AND application_id = ?`,
      [email.trim(), application_id.trim()]
    );

    if (!app) {
      return res.status(404).json({ error: 'No application found with the provided credentials.' });
    }

    const normalized = normalizeAppKeys(app);

    if (normalized.status !== 'Selected' && normalized.status !== 'Active Intern' && normalized.status !== 'Completed') {
      return res.status(403).json({ error: 'Access Denied: Terms & Conditions are only accessible to Selected candidates.' });
    }

    return res.json({
      success: true,
      eligible: true,
      termsAccepted: !!normalized.termsAccepted,
      signedAt: normalized.signedAt,
      application: {
        id: normalized.id,
        application_id: normalized.application_id,
        full_name: normalized.full_name,
        email: normalized.email,
        status: normalized.status
      }
    });

  } catch (error) {
    console.error('Error verifying T&C eligibility:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Submit Digital Signature
app.post('/api/internships/submit-signature', async (req, res) => {
  const { email, application_id, signatureImage, browserInfo, deviceInfo, ipAddress } = req.body;
  if (!email || !application_id || !signatureImage) {
    return res.status(400).json({ error: 'Email, Application ID, and Signature Image are required.' });
  }

  try {
    const app = await dbGet(
      `SELECT * FROM applications WHERE LOWER(email) = LOWER(?) AND application_id = ?`,
      [email.trim(), application_id.trim()]
    );

    if (!app) {
      return res.status(404).json({ error: 'No application found with the provided credentials.' });
    }

    const normalized = normalizeAppKeys(app);

    if (normalized.status !== 'Selected' && normalized.status !== 'Active Intern' && normalized.status !== 'Completed') {
      return res.status(403).json({ error: 'Access Denied: You are not authorized to sign this agreement.' });
    }

    if (normalized.termsAccepted) {
      return res.status(400).json({ error: 'You have already accepted and signed the Terms & Conditions.' });
    }

    const timestamp = new Date().toISOString();
    const clientIp = ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    
    const auditLog = JSON.stringify([{
      event: 'Terms accepted and signed',
      timestamp,
      ipAddress: clientIp,
      browserInfo,
      deviceInfo
    }]);

    const signedPdfVersion = 'manchestertechnologiestandc.pdf';

    await dbRun(
      `UPDATE applications 
       SET termsAccepted = 1,
           signedAt = ?,
           signatureImage = ?,
           browserInfo = ?,
           deviceInfo = ?,
           ipAddress = ?,
           signedPdfVersion = ?,
           signatureAuditLog = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        timestamp,
        signatureImage,
        browserInfo,
        deviceInfo,
        clientIp,
        signedPdfVersion,
        auditLog,
        timestamp,
        normalized.id
      ]
    );

    console.log(`✍️ Application ${application_id} successfully signed by ${normalized.full_name}.`);

    return res.json({
      success: true,
      message: 'Terms & Conditions Successfully Accepted',
      signedAt: timestamp,
      application_id: normalized.application_id
    });

  } catch (error) {
    console.error('Error submitting signature:', error);
    return res.status(500).json({ error: 'Failed to record signature. Please try again.' });
  }
});

// Admin endpoint: Fetch signed T&C details
app.get('/api/admin/applications/:id/signed-tc', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const app = await dbGet(
      `SELECT id, application_id, full_name, email, status, termsAccepted, signedAt, signatureImage, browserInfo, deviceInfo, ipAddress, signedPdfVersion, signatureAuditLog 
       FROM applications WHERE id = ?`,
      [id]
    );

    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    return res.json({ success: true, application: normalizeAppKeys(app) });
  } catch (error) {
    console.error('Error fetching signed T&C details:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin endpoint: Generate and download signed PDF
app.get('/api/admin/applications/:id/download-signed-pdf', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const normalized = normalizeAppKeys(app);

    if (!normalized.termsAccepted) {
      return res.status(400).json({ error: 'This candidate has not signed the Terms & Conditions yet.' });
    }

    const tempPdfName = `signed-agreement-${normalized.application_id}-${Date.now()}.pdf`;
    const tempPdfPath = path.join(CERTS_DIR, tempPdfName);

    await generateSignedAgreementPDF(normalized, tempPdfPath);

    res.download(tempPdfPath, `Signed_Agreement_${app.application_id}.pdf`, (err) => {
      try {
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
        }
      } catch (unlinkErr) {
        console.error('Failed to unlink temporary signed agreement PDF:', unlinkErr);
      }
    });

  } catch (error) {
    console.error('Failed to download signed PDF:', error);
    return res.status(500).json({ error: 'Internal server error while generating signed PDF.' });
  }
});


/* =========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================= */

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {

    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const admin = await dbGet(`SELECT * FROM admins WHERE email = ?`, [email]);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Synchronous comparison using bcryptjs since standard
    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: 'admin'
    });

    return res.json({
      success: true,
      token,
      user: { id: admin.id, username: admin.username, email: admin.email, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal login error.' });
  }
});

// Intern Login (using Email and Application ID)
app.post('/api/auth/intern-login', async (req, res) => {
  const { email, application_id } = req.body;
  if (!email || !application_id) {
    return res.status(400).json({ error: 'Email and Application ID are required.' });
  }

  try {
    const application = await dbGet(
      `SELECT * FROM applications WHERE email = ? AND application_id = ?`,
      [email.trim(), application_id.trim()]
    );

    if (!application) {
      return res.status(401).json({ error: 'Invalid Email or Application ID.' });
    }

    if (!['Selected', 'Active Intern', 'Completed'].includes(application.status)) {
      return res.status(403).json({ error: 'Access Denied: Intern dashboard is only available for Selected or Active interns.' });
    }

    const token = generateToken({
      id: application.id,
      application_id: application.application_id,
      full_name: application.full_name,
      email: application.email,
      role: 'intern'
    });

    return res.json({
      success: true,
      token,
      user: {
        id: application.id,
        application_id: application.application_id,
        full_name: application.full_name,
        email: application.email,
        role: 'intern'
      }
    });

  } catch (error) {
    console.error('Intern login error:', error);
    return res.status(500).json({ error: 'Internal login error.' });
  }
});

/* =========================================================================
   INTERN ENDPOINTS
   ========================================================================= */

// Get Intern Dashboard Information
app.get('/api/intern/dashboard', authenticate, requireInternOrAdmin, async (req, res) => {
  const application_id = req.user.role === 'admin' ? req.query.application_id : req.user.application_id;

  if (!application_id) {
    return res.status(400).json({ error: 'Application ID is required.' });
  }

  try {
    const application = await dbGet(
      `SELECT application_id, full_name, email, preferred_domain, preferred_duration, status 
       FROM applications WHERE application_id = ?`,
      [application_id]
    );

    if (!application) {
      return res.status(404).json({ error: 'Intern application record not found.' });
    }

    const project = await dbGet(`SELECT * FROM project_assignments WHERE application_id = ?`, [application_id]);
    
    // Auto-parse tasks if string
    let tasks = [];
    if (project && project.tasks) {
      try {
        tasks = JSON.parse(project.tasks);
      } catch (err) {
        tasks = [];
      }
    }

    return res.json({
      application,
      project: project ? { ...project, tasks } : null
    });

  } catch (error) {
    console.error('Error fetching intern project details:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Intern submits task status updates
app.post('/api/intern/tasks/update', authenticate, requireInternOrAdmin, async (req, res) => {
  const application_id = req.user.role === 'admin' ? req.body.application_id : req.user.application_id;
  const { tasks } = req.body; // Array of updated tasks

  if (!application_id || !tasks) {
    return res.status(400).json({ error: 'Application ID and tasks list are required.' });
  }

  try {
    const tasksString = JSON.stringify(tasks);
    await dbRun(
      `UPDATE project_assignments SET tasks = ? WHERE application_id = ?`,
      [tasksString, application_id]
    );

    return res.json({ success: true, message: 'Tasks updated successfully.' });
  } catch (error) {
    console.error('Error saving tasks progress:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


/* =========================================================================
   ADMIN DASHBOARD ENDPOINTS
   ========================================================================= */

// Get Dashboard Statistics
app.get('/api/admin/metrics', authenticate, requireAdmin, async (req, res) => {
  try {
    const total = await dbGet(`SELECT COUNT(*) as count FROM applications`);
    const pending = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE status = 'Submitted' OR status = 'Pending'`);
    const shortlisted = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE status = 'Shortlisted'`);
    const selected = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE status = 'Selected'`);
    const active = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE status = 'Active Intern'`);

    return res.json({
      total: total.count,
      pending: pending.count,
      shortlisted: shortlisted.count,
      selected: selected.count,
      active: active.count
    });
  } catch (error) {
    console.error('Admin metrics fetch failed:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

// Get Applications List with Search & Filtering
app.get('/api/admin/applications', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, domain, status, duration, college, date } = req.query;
    
    let sql = `SELECT id, application_id, full_name, email, phone, college_name, preferred_domain, preferred_duration, status, created_at, email_notification_sent, email_notification_error, country, degree, branch, certifications, previous_experience, experience_description, additional_comments, resume_path, termsAccepted FROM applications WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (full_name LIKE ? OR email LIKE ? OR skills LIKE ? OR college_name LIKE ? OR university_name LIKE ? OR application_id LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    if (domain) {
      sql += ` AND preferred_domain = ?`;
      params.push(domain);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (duration) {
      sql += ` AND preferred_duration = ?`;
      params.push(duration);
    }

    if (college) {
      sql += ` AND college_name LIKE ?`;
      params.push(`%${college}%`);
    }

    if (date) {
      sql += ` AND created_at LIKE ?`;
      params.push(`${date}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    const apps = await dbQuery(sql, params);
    const normalizedApps = apps.map(normalizeAppKeys);
    return res.json({ success: true, applications: normalizedApps });
  } catch (error) {
    console.error('Fetch applications failed:', error);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// Get Single Application Full Profile
app.get('/api/admin/applications/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Fetch related logs/interviews/projects
    const interview = await dbGet(`SELECT * FROM interviews WHERE application_id = ?`, [app.application_id]);
    const project = await dbGet(`SELECT * FROM project_assignments WHERE application_id = ?`, [app.application_id]);
    const certificate = await dbGet(`SELECT * FROM certificates WHERE application_id = ?`, [app.application_id]);

    let parsedTasks = [];
    if (project && project.tasks) {
      try {
        parsedTasks = JSON.parse(project.tasks);
      } catch (err) {
        parsedTasks = [];
      }
    }

    return res.json({
      success: true,
      application: app,
      interview,
      project: project ? { ...project, tasks: parsedTasks } : null,
      certificate
    });
  } catch (error) {
    console.error('Fetch full profile failed:', error);
    return res.status(500).json({ error: 'Failed to fetch candidate profile.' });
  }
});

// Delete Application (Admin only)
app.delete('/api/admin/applications/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const appRecord = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!appRecord) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    
    // Delete files
    const filesToDelete = [appRecord.resume_path, appRecord.portfolio_path, appRecord.docs_path];
    filesToDelete.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted file: ${filePath}`);
        } catch (e) {
          console.error(`Failed to delete file: ${filePath}`, e);
        }
      }
    });

    // Delete related records
    await dbRun(`DELETE FROM interviews WHERE application_id = ?`, [appRecord.application_id]);
    await dbRun(`DELETE FROM project_assignments WHERE application_id = ?`, [appRecord.application_id]);
    await dbRun(`DELETE FROM certificates WHERE application_id = ?`, [appRecord.application_id]);
    
    // Delete application
    await dbRun(`DELETE FROM applications WHERE id = ?`, [id]);

    return res.json({ success: true, message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('Delete application error:', error);
    return res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// Update Application Notes
app.post('/api/admin/applications/:id/notes', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    await dbRun(`UPDATE applications SET notes = ? WHERE id = ?`, [notes, id]);
    return res.json({ success: true, message: 'Notes updated successfully.' });
  } catch (error) {
    console.error('Save notes error:', error);
    return res.status(500).json({ error: 'Failed to save admin notes.' });
  }
});

// Update Application Status (Generic)
app.post('/api/admin/applications/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated_at = new Date().toISOString();
    await dbRun(`UPDATE applications SET status = ?, updated_at = ? WHERE id = ?`, [status, updated_at, id]);
    return res.json({ success: true, message: `Status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// Resend Email Notification (Trigger manually)
app.post('/api/admin/applications/:id/resend-email', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const application = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    try {
      await sendAdminNotification(application);
      await sendApplicantConfirmation(application);
      
      await dbRun(`UPDATE applications SET email_notification_sent = 1, email_notification_error = NULL WHERE id = ?`, [id]);
      return res.json({ success: true, message: 'Emails resent successfully.' });
    } catch (mailErr) {
      const errorMsg = mailErr.message || 'SMTP transmission failure';
      await dbRun(`UPDATE applications SET email_notification_sent = 0, email_notification_error = ? WHERE id = ?`, [errorMsg, id]);
      return res.status(500).json({ error: `Mail transmission failed: ${errorMsg}` });
    }

  } catch (error) {
    console.error('Resend email error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Schedule Interview
app.post('/api/admin/applications/:id/interview', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { interview_date, interview_time, venue, online_link, instructions } = req.body;

  if (!interview_date || !interview_time || !venue) {
    return res.status(400).json({ error: 'Date, time, and venue are required.' });
  }

  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const created_at = new Date().toISOString();

    // Check if interview schedule already exists, replace or insert
    const exists = await dbGet(`SELECT id FROM interviews WHERE application_id = ?`, [app.application_id]);
    if (exists) {
      await dbRun(`
        UPDATE interviews 
        SET interview_date = ?, interview_time = ?, venue = ?, online_link = ?, instructions = ?, created_at = ? 
        WHERE application_id = ?
      `, [interview_date, interview_time, venue, online_link, instructions, created_at, app.application_id]);
    } else {
      await dbRun(`
        INSERT INTO interviews (application_id, interview_date, interview_time, venue, online_link, instructions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [app.application_id, interview_date, interview_time, venue, online_link, instructions, created_at]);
    }

    // Update Application status
    await dbRun(`UPDATE applications SET status = 'Interview Scheduled', updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);

    // Send notification
    const updatedApp = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    const interview = await dbGet(`SELECT * FROM interviews WHERE application_id = ?`, [app.application_id]);

    try {
      await sendInterviewInvitation(updatedApp, interview);
    } catch (mailErr) {
      console.error('Failed sending interview mail invitation:', mailErr);
    }

    return res.json({ success: true, message: 'Interview scheduled and invitation sent.' });

  } catch (error) {
    console.error('Schedule interview error:', error);
    return res.status(500).json({ error: 'Failed to schedule interview.' });
  }
});

// Assign Project (Sets status to Active Intern)
app.post('/api/admin/applications/:id/assign-project', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { github_username, assigned_repository, repository_url, mentor_name, project_name, start_date, end_date } = req.body;

  if (!github_username || !assigned_repository || !repository_url || !mentor_name || !project_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'All project assignment parameters are required.' });
  }

  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Default initial tasks
    const initialTasks = [
      { id: 1, task: 'Complete Confidentiality & Security briefing', deadline: start_date, status: 'Pending', progress: 0 },
      { id: 2, task: 'Clone project repository and set up environment', deadline: start_date, status: 'Pending', progress: 0 }
    ];

    const tasksString = JSON.stringify(initialTasks);

    const exists = await dbGet(`SELECT id FROM project_assignments WHERE application_id = ?`, [app.application_id]);
    if (exists) {
      await dbRun(`
        UPDATE project_assignments
        SET github_username = ?, assigned_repository = ?, repository_url = ?, mentor_name = ?, project_name = ?, start_date = ?, end_date = ?
        WHERE application_id = ?
      `, [github_username, assigned_repository, repository_url, mentor_name, project_name, start_date, end_date, app.application_id]);
    } else {
      await dbRun(`
        INSERT INTO project_assignments (application_id, github_username, assigned_repository, repository_url, mentor_name, project_name, start_date, end_date, tasks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [app.application_id, github_username, assigned_repository, repository_url, mentor_name, project_name, start_date, end_date, tasksString]);
    }

    // Update status to 'Active Intern'
    await dbRun(`UPDATE applications SET status = 'Active Intern', updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);

    return res.json({ success: true, message: 'Project assigned and intern activated.' });

  } catch (error) {
    console.error('Project assignment error:', error);
    return res.status(500).json({ error: 'Failed to assign project.' });
  }
});

// Update Checklist Tasks (Admin adds or replaces tasks list)
app.post('/api/admin/applications/:id/tasks', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { tasks } = req.body; // Array of tasks
  
  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const tasksString = JSON.stringify(tasks);
    await dbRun(`UPDATE project_assignments SET tasks = ? WHERE application_id = ?`, [tasksString, app.application_id]);
    return res.json({ success: true, message: 'Tasks updated successfully.' });

  } catch (error) {
    console.error('Update tasks error:', error);
    return res.status(500).json({ error: 'Failed to update tasks checklist.' });
  }
});

// Submit Mentor Feedback
app.post('/api/admin/applications/:id/feedback', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await dbRun(`UPDATE project_assignments SET mentor_feedback = ? WHERE application_id = ?`, [feedback, app.application_id]);
    return res.json({ success: true, message: 'Feedback saved successfully.' });
  } catch (error) {
    console.error('Feedback save error:', error);
    return res.status(500).json({ error: 'Failed to save mentor feedback.' });
  }
});

// Complete Internship & Issue Certificate
app.post('/api/admin/applications/:id/complete', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const app = await dbGet(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const project = await dbGet(`SELECT * FROM project_assignments WHERE application_id = ?`, [app.application_id]);
    if (!project) {
      return res.status(400).json({ error: 'No active project assignment found for this intern.' });
    }

    // Generate Certificate Number (MTI-CERT-YYYY-NNNN)
    const year = new Date().getFullYear();
    const row = await dbGet(`SELECT COUNT(*) as count FROM certificates`);
    const count = (row ? row.count : 0) + 1;
    const certNumber = `MTI-CERT-${year}-${String(count).padStart(4, '0')}`;

    const certData = {
      application_id: app.application_id,
      certificate_number: certNumber,
      candidate_name: app.full_name,
      domain: app.preferred_domain,
      duration: app.preferred_duration,
      start_date: project.start_date,
      end_date: project.end_date,
      created_at: new Date().toISOString()
    };

    // Save Certificate metadata
    await dbRun(`
      INSERT INTO certificates (application_id, certificate_number, candidate_name, domain, duration, start_date, end_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [certData.application_id, certData.certificate_number, certData.candidate_name, certData.domain, certData.duration, certData.start_date, certData.end_date, certData.created_at]);

    // Build PDF Certificate
    const certPath = path.join(CERTS_DIR, `${certNumber}.pdf`);
    await generateCertificatePDF(certData, certPath);

    // Update status to 'Completed'
    await dbRun(`UPDATE applications SET status = 'Completed', updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);

    return res.json({
      success: true,
      message: 'Internship completed successfully and certificate issued.',
      certificate_number: certNumber
    });

  } catch (error) {
    console.error('Completion process failed:', error);
    return res.status(500).json({ error: 'Failed to complete internship and generate certificate.' });
  }
});

// Download PDF Certificate (Publicly available via Certificate Verification or Status dashboard)
app.get('/api/internships/certificate/download/:certificateNumber', async (req, res) => {
  const { certificateNumber } = req.params;
  const certPath = path.join(CERTS_DIR, `${certificateNumber}.pdf`);

  if (!fs.existsSync(certPath)) {
    return res.status(404).send('Certificate file not found.');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certificateNumber}.pdf`);
  return res.sendFile(certPath);
});

// Secure download for resume/docs (Admin only)
app.get('/api/admin/files/download/:filename', authenticate, requireAdmin, async (req, res) => {
  const { filename } = req.params;
  
  // Prevent path traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    // Detect mime type or download as stream
    return res.download(filePath, safeFilename);
  }

  // Fallback: load from database if file is not found on disk (e.g. serverless environment like Vercel)
  try {
    const match = safeFilename.match(/^(MT[A-Za-z0-9\-]+)_(resume|portfolio|docs)(\.[a-zA-Z0-9]+)$/i);
    if (!match) {
      return res.status(404).send('File not found and filename format is invalid.');
    }

    const [_, appId, fileType, ext] = match;
    const colName = `${fileType}_data`; // e.g. resume_data, portfolio_data, docs_data
    
    // Validate colName to prevent SQL injection
    if (!['resume_data', 'portfolio_data', 'docs_data'].includes(colName)) {
      return res.status(400).send('Invalid file query.');
    }

    const application = await dbGet(`SELECT ${colName} FROM applications WHERE application_id = ?`, [appId]);
    if (!application || !application[colName]) {
      return res.status(404).send('File not found on disk or database.');
    }

    const fileBuffer = Buffer.from(application[colName], 'base64');
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
    return res.send(fileBuffer);
  } catch (err) {
    console.error('File download database fallback error:', err);
    return res.status(500).send('Error retrieving file from database.');
  }
});


// Serve frontend in production (Vite Build output)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
  next();
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
  });
}

export default app;
