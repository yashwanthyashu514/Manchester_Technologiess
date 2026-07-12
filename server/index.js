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
  sendInterviewInvitation,
  sendSelectionNotification,
  sendSignatureConfirmation
} from './email.js';

import {
  authenticate,
  requireAdmin,
  requireInternOrAdmin,
  requireMentor,
  requireMentorOrAdmin,
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

// ── Simple in-memory rate limiter ─────────────────────────────────────────
const rateLimitStore = new Map();
const rateLimit = (maxRequests = 10, windowMs = 60000) => (req, res, next) => {
  const key = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  const requests = rateLimitStore.get(key).filter(ts => ts > windowStart);
  requests.push(now);
  rateLimitStore.set(key, requests);
  if (requests.length > maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }
  next();
};
// Cleanup old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 120000;
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const fresh = timestamps.filter(ts => ts > cutoff);
    if (fresh.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, fresh);
  }
}, 300000);


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

// Database initialization wrapper for serverless environments (cold start safe)
let isDbInitialized = false;
let dbInitPromise = null;

const ensureDb = async (req, res, next) => {
  if (isDbInitialized) return next();
  if (!dbInitPromise) {
    dbInitPromise = initDb().then(() => {
      isDbInitialized = true;
    }).catch(err => {
      dbInitPromise = null;
      throw err;
    });
  }
  try {
    await dbInitPromise;
    next();
  } catch (err) {
    console.error('Database initialization failed in middleware:', err);
    return res.status(500).json({ error: `Database initialization failed: ${err.message}` });
  }
};

// Apply database initializer middleware to all API routes
app.use('/api', ensureDb);

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

// Track Application Status (simplified 3-state view from application_status table)
app.post('/api/internships/track-status', rateLimit(10, 60000), async (req, res) => {
  const { email, tracking_id } = req.body;
  if (!email || !tracking_id) {
    return res.status(400).json({ error: 'Gmail and Tracking ID are required.' });
  }

  try {
    const record = await dbGet(
      `SELECT * FROM application_status WHERE LOWER(email) = LOWER(?) AND tracking_id = ?`,
      [email.trim(), tracking_id.trim().toUpperCase()]
    );

    if (!record) {
      return res.status(404).json({ error: 'No record found. Please verify your Gmail and Tracking ID.' });
    }

    // If Selected, check if they already signed T&C
    let termsAccepted = false;
    let signedAt = null;
    let certificateId = null;
    if (record.status === 'Selected') {
      const appRecord = await dbGet(
        `SELECT termsAccepted, signedAt FROM applications WHERE LOWER(email) = LOWER(?) AND application_id = ?`,
        [email.trim(), tracking_id.trim().toUpperCase()]
      );
      const normalized = normalizeAppKeys(appRecord || {});
      termsAccepted = !!normalized.termsAccepted;
      signedAt = normalized.signedAt;

      if (termsAccepted) {
        const sigRecord = await dbGet(
          `SELECT certificate_id FROM digital_signatures WHERE application_id = ?`,
          [tracking_id.trim().toUpperCase()]
        );
        certificateId = sigRecord ? sigRecord.certificate_id : null;
      }
    }

    return res.json({
      success: true,
      record: {
        id: record.id,
        tracking_id: record.tracking_id,
        email: record.email,
        candidate_name: record.candidate_name,
        domain: record.domain,
        mentor: record.mentor,
        status: record.status,
        start_date: record.start_date,
        reporting_details: record.reporting_details,
        remarks: record.remarks,
        created_at: record.created_at,
        updated_at: record.updated_at
      },
      termsAccepted,
      signedAt,
      certificateId
    });

  } catch (error) {
    console.error('Track status error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Verify Internship Signature (Public Route) — checks MT-SIGN certificate IDs
app.get('/api/internships/verify-signature/:certId', rateLimit(15, 60000), async (req, res) => {
  const { certId } = req.params;
  try {
    const sig = await dbGet(
      `SELECT certificate_id, application_id, email, candidate_name, domain, signed_at, created_at FROM digital_signatures WHERE certificate_id = ?`,
      [certId.toUpperCase()]
    );
    if (!sig) {
      return res.status(404).json({ valid: false, error: 'Invalid Certificate ID. No matching signature record found.' });
    }
    return res.json({
      valid: true,
      signature: {
        certificate_id: sig.certificate_id,
        candidate_name: sig.candidate_name,
        email: sig.email,
        domain: sig.domain,
        application_id: sig.application_id,
        signed_at: sig.signed_at,
        created_at: sig.created_at
      }
    });
  } catch (error) {
    console.error('Verify signature error:', error);
    return res.status(500).json({ error: 'Internal verification error.' });
  }
});

// POST version of verify-signature (for form submissions)
app.post('/api/internships/verify-signature', rateLimit(15, 60000), async (req, res) => {
  const { cert_id } = req.body;
  if (!cert_id) return res.status(400).json({ error: 'Certificate ID is required.' });
  try {
    const sig = await dbGet(
      `SELECT certificate_id, application_id, email, candidate_name, domain, signed_at, created_at FROM digital_signatures WHERE certificate_id = ?`,
      [cert_id.toUpperCase()]
    );
    if (!sig) {
      return res.status(404).json({ valid: false, error: 'Invalid Certificate ID. No matching signature record found.' });
    }
    return res.json({
      valid: true,
      signature: {
        certificate_id: sig.certificate_id,
        candidate_name: sig.candidate_name,
        email: sig.email,
        domain: sig.domain,
        application_id: sig.application_id,
        signed_at: sig.signed_at
      }
    });
  } catch (error) {
    console.error('Verify signature error:', error);
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
    const pdfPath = path.join(__dirname, '..', 'public', 'manchestertechnologiestandc-updated.pdf');
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
    drawDetailRow('Signed Version:', appData.signedPdfVersion || 'manchestertechnologiestandc-updated.pdf', height - 220);

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

    const signedPdfVersion = 'manchestertechnologiestandc-updated.pdf';

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

    // Generate MT-SIGN Certificate ID
    const year = new Date().getFullYear();
    const sigRow = await dbGet(`SELECT COUNT(*) as count FROM digital_signatures`);
    const sigCount = ((sigRow ? sigRow.count : 0) + 1);
    const certId = `MT-SIGN-${year}-${String(sigCount).padStart(6, '0')}`;

    // Insert into digital_signatures table
    try {
      await dbRun(
        `INSERT INTO digital_signatures (certificate_id, application_id, email, candidate_name, domain, signature_image, signed_at, ip_address, browser_info, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [certId, normalized.application_id, normalized.email, normalized.full_name, normalized.preferred_domain || '', signatureImage, timestamp, clientIp, browserInfo, timestamp]
      );
    } catch (sigInsertErr) {
      console.warn('⚠️ Failed to insert digital_signatures record (non-blocking):', sigInsertErr.message);
    }

    console.log(`✍️ Application ${application_id} signed by ${normalized.full_name}. Certificate ID: ${certId}`);

    // Trigger auto-assignment of mentor based on domain and workloads
    try {
      await autoAssignMentor(normalized.application_id);
    } catch (assignErr) {
      console.warn('⚠️ Auto-assignment failed:', assignErr.message);
    }

    // Send signature confirmation email (non-blocking)
    try {
      await sendSignatureConfirmation(normalized.full_name, normalized.email, normalized.application_id, certId, timestamp);
    } catch (emailErr) {
      console.warn('⚠️ Signature confirmation email failed (non-blocking):', emailErr.message);
    }

    return res.json({
      success: true,
      message: 'Terms & Conditions Successfully Accepted',
      signedAt: timestamp,
      application_id: normalized.application_id,
      certificate_id: certId
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
    return res.status(500).json({ error: `Internal login error: ${error.message}` });
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
      application: normalizeAppKeys(app),
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


/* =========================================================================
   ADMIN: APPLICATION STATUS MANAGEMENT (new application_status table)
   ========================================================================= */

// List all application status records (with search/filter)
app.get('/api/admin/application-status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `SELECT * FROM application_status WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ` AND (candidate_name LIKE ? OR email LIKE ? OR tracking_id LIKE ? OR domain LIKE ?)`;
      const w = `%${search}%`;
      params.push(w, w, w, w);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    const records = await dbQuery(sql, params);
    return res.json({ success: true, records });
  } catch (error) {
    console.error('Fetch application status list error:', error);
    return res.status(500).json({ error: 'Failed to fetch application status records.' });
  }
});

// Create a new application status record
app.post('/api/admin/application-status', authenticate, requireAdmin, async (req, res) => {
  const { tracking_id, email, candidate_name, domain, mentor, status, start_date, reporting_details, remarks } = req.body;
  if (!tracking_id || !email || !candidate_name || !status) {
    return res.status(400).json({ error: 'Tracking ID, Email, Candidate Name, and Status are required.' });
  }
  try {
    // Check for duplicate tracking_id
    const existing = await dbGet(`SELECT id FROM application_status WHERE tracking_id = ?`, [tracking_id.toUpperCase()]);
    if (existing) {
      return res.status(400).json({ error: 'A record with this Tracking ID already exists.' });
    }
    const now = new Date().toISOString();
    await dbRun(
      `INSERT INTO application_status (tracking_id, email, candidate_name, domain, mentor, status, start_date, reporting_details, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tracking_id.toUpperCase(), email.trim(), candidate_name.trim(), domain || '', mentor || '', status, start_date || '', reporting_details || '', remarks || '', now, now]
    );

    // If status is 'Selected', send notification email
    if (status === 'Selected') {
      const statusRecord = { tracking_id: tracking_id.toUpperCase(), domain, mentor, start_date, reporting_details };
      try {
        await sendSelectionNotification(candidate_name, email, statusRecord);
      } catch (emailErr) {
        console.warn('⚠️ Selection notification email failed (non-blocking):', emailErr.message);
      }
    }

    return res.json({ success: true, message: 'Application status record created successfully.' });
  } catch (error) {
    console.error('Create application status error:', error);
    return res.status(500).json({ error: 'Failed to create application status record.' });
  }
});

// Update an application status record
app.put('/api/admin/application-status/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { domain, mentor, status, start_date, reporting_details, remarks } = req.body;
  try {
    const existing = await dbGet(`SELECT * FROM application_status WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    const now = new Date().toISOString();
    await dbRun(
      `UPDATE application_status SET domain = ?, mentor = ?, status = ?, start_date = ?, reporting_details = ?, remarks = ?, updated_at = ? WHERE id = ?`,
      [domain || existing.domain, mentor || existing.mentor, status || existing.status, start_date || existing.start_date, reporting_details || existing.reporting_details, remarks || existing.remarks, now, id]
    );

    // If newly set to 'Selected', send notification
    if (status === 'Selected' && existing.status !== 'Selected') {
      const updatedRecord = { tracking_id: existing.tracking_id, domain, mentor, start_date, reporting_details };
      try {
        await sendSelectionNotification(existing.candidate_name, existing.email, updatedRecord);
      } catch (emailErr) {
        console.warn('⚠️ Selection notification email failed (non-blocking):', emailErr.message);
      }
    }

    return res.json({ success: true, message: 'Application status record updated successfully.' });
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ error: 'Failed to update application status record.' });
  }
});

// Delete an application status record
app.delete('/api/admin/application-status/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await dbGet(`SELECT id FROM application_status WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    await dbRun(`DELETE FROM application_status WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (error) {
    console.error('Delete application status error:', error);
    return res.status(500).json({ error: 'Failed to delete record.' });
  }
});

/* =========================================================================
   ADMIN: DIGITAL SIGNATURES MANAGEMENT
   ========================================================================= */

// List all digital signatures (with search)
app.get('/api/admin/digital-signatures', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `SELECT id, certificate_id, application_id, email, candidate_name, domain, signed_at, ip_address, browser_info, created_at FROM digital_signatures WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ` AND (certificate_id LIKE ? OR application_id LIKE ? OR email LIKE ? OR candidate_name LIKE ?)`;
      const w = `%${search}%`;
      params.push(w, w, w, w);
    }
    sql += ` ORDER BY signed_at DESC`;
    const records = await dbQuery(sql, params);
    return res.json({ success: true, records });
  } catch (error) {
    console.error('Fetch digital signatures error:', error);
    return res.status(500).json({ error: 'Failed to fetch digital signatures.' });
  }
});

// Verify a certificate ID (admin)
app.get('/api/admin/digital-signatures/:certId/verify', authenticate, requireAdmin, async (req, res) => {
  const { certId } = req.params;
  try {
    const sig = await dbGet(`SELECT * FROM digital_signatures WHERE certificate_id = ?`, [certId.toUpperCase()]);
    if (!sig) {
      return res.json({ valid: false, message: 'No matching signature record found.' });
    }
    return res.json({ valid: true, signature: sig });
  } catch (error) {
    console.error('Admin verify signature error:', error);
    return res.status(500).json({ error: 'Internal verification error.' });
  }
});

// Admin: Download signed PDF by application id (uses existing generate function)
app.get('/api/admin/digital-signatures/:appId/download-pdf', authenticate, requireAdmin, async (req, res) => {
  const { appId } = req.params;
  try {
    // Find the application by application_id
    const appRecord = await dbGet(`SELECT * FROM applications WHERE application_id = ?`, [appId]);
    if (!appRecord) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    const normalized = normalizeAppKeys(appRecord);
    if (!normalized.termsAccepted) {
      return res.status(400).json({ error: 'This candidate has not signed the Terms & Conditions yet.' });
    }
    const tempPdfName = `signed-agreement-${appId}-${Date.now()}.pdf`;
    const tempPdfPath = path.join(CERTS_DIR, tempPdfName);
    await generateSignedAgreementPDF(normalized, tempPdfPath);
    res.download(tempPdfPath, `Signed_Agreement_${appId}.pdf`, (err) => {
      try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch (e) {}
    });
  } catch (error) {
    console.error('Admin digital signature download error:', error);
    return res.status(500).json({ error: 'Failed to generate signed PDF.' });
  }
});


/* =========================================================================
   MENTOR MANAGEMENT & MENTOR SYSTEM ENDPOINTS
   ========================================================================= */

// Smart workload-balanced automatic mentor assignment
const autoAssignMentor = async (applicationId) => {
  try {
    const app = await dbGet(`SELECT application_id, preferred_domain, full_name, email FROM applications WHERE application_id = ?`, [applicationId]);
    if (!app) return;
    
    // 1. Fetch all active mentors
    const mentors = await dbQuery(`SELECT * FROM mentors WHERE status = 'Active'`);
    if (!mentors || mentors.length === 0) {
      console.warn('⚠️ No active mentors available for auto-assignment.');
      return;
    }
    
    // 2. Filter mentors matching preferred domain if any exist
    let domainMentors = mentors.filter(m => {
      const mDom = (m.domain || '').toLowerCase().trim();
      const aDom = (app.preferred_domain || '').toLowerCase().trim();
      return mDom.includes(aDom) || aDom.includes(mDom);
    });
    
    // Fallback to all active mentors if none match preferred domain
    const candidateMentors = domainMentors.length > 0 ? domainMentors : mentors;
    
    // 3. For each candidate mentor, query workload count (Selected or Active Intern status)
    const mentorWorkloads = [];
    for (const mentor of candidateMentors) {
      const row = await dbGet(
        `SELECT COUNT(*) as count FROM applications WHERE mentor_id = ? AND status IN ('Selected', 'Active Intern')`,
        [mentor.id]
      );
      mentorWorkloads.push({
        mentor,
        count: row ? row.count : 0
      });
    }
    
    // Sort mentors by workload count ascending
    mentorWorkloads.sort((a, b) => a.count - b.count);
    const chosen = mentorWorkloads[0].mentor;
    
    // 4. Update application with assigned mentor details
    await dbRun(
      `UPDATE applications SET mentor_id = ?, mentor_name = ?, updated_at = ? WHERE application_id = ?`,
      [chosen.id, chosen.full_name, new Date().toISOString(), applicationId]
    );
    
    // 5. Log activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['system', 'system', 'Auto-assigned Mentor', `Assigned mentor ${chosen.full_name} to intern ${app.full_name} (${applicationId})`, '127.0.0.1', new Date().toISOString()]
    );
    
    // 6. Push notifications
    // Notification for Intern
    await dbRun(
      `INSERT INTO notifications (application_id, role, title, message, type, created_at)
       VALUES (?, 'intern', 'Mentor Assigned', 'Mentor ${chosen.full_name} has been assigned to guide your internship domain.', 'feedback', ?)`,
      [applicationId, new Date().toISOString()]
    );
    // Notification for Mentor
    await dbRun(
      `INSERT INTO notifications (mentor_id, role, title, message, type, created_at)
       VALUES (?, 'mentor', 'New Intern Assigned', 'Intern ${app.full_name} (${applicationId}) has been assigned to your supervision.', 'assignment', ?)`,
      [chosen.id, new Date().toISOString()]
    );
    
    console.log(`🤖 Smart Auto-Assignment: Assigned ${chosen.full_name} to ${app.full_name} (${applicationId}) [Workload: ${mentorWorkloads[0].count}]`);
  } catch (err) {
    console.error('❌ Error in auto-assigning mentor:', err);
  }
};

// Mentor Authentication Login
app.post('/api/auth/mentor-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const mentor = await dbGet(`SELECT * FROM mentors WHERE LOWER(email) = LOWER(?)`, [email.trim()]);
    if (!mentor) {
      return res.status(401).json({ error: 'Invalid Email or Password.' });
    }

    if (mentor.status !== 'Active') {
      return res.status(403).json({ error: 'Access Denied: Your mentor account is currently disabled.' });
    }

    const isValid = bcrypt.compareSync(password, mentor.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Email or Password.' });
    }

    const token = generateToken({
      id: mentor.id,
      email: mentor.email,
      full_name: mentor.full_name,
      role: 'mentor'
    });

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mentor.email, 'mentor', 'Mentor Login', 'Mentor successfully logged in', req.ip || '', new Date().toISOString()]
    );

    return res.json({
      success: true,
      token,
      user: {
        id: mentor.id,
        email: mentor.email,
        full_name: mentor.full_name,
        role: 'mentor',
        domain: mentor.domain
      }
    });

  } catch (err) {
    console.error('Mentor login error:', err);
    return res.status(500).json({ error: `Internal login error: ${err.message}` });
  }
});

// Mentor Change Password
app.post('/api/mentor/change-password', authenticate, requireMentor, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const mentor = await dbGet(`SELECT * FROM mentors WHERE id = ?`, [req.user.id]);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    const isValid = bcrypt.compareSync(currentPassword, mentor.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await dbRun(`UPDATE mentors SET password_hash = ?, updated_at = ? WHERE id = ?`, [newHash, new Date().toISOString(), req.user.id]);

    // Log activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mentor.email, 'mentor', 'Password Reset / Change', 'Mentor changed password', req.ip || '', new Date().toISOString()]
    );

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Mentor Management - Retrieve Mentors list with workload counts
app.get('/api/admin/mentors', authenticate, requireAdmin, async (req, res) => {
  try {
    const mentors = await dbQuery(`SELECT id, email, full_name, domain, status, created_at, updated_at FROM mentors`);
    const results = [];
    
    for (const m of mentors) {
      const assigned = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE mentor_id = ?`, [m.id]);
      const active = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE mentor_id = ? AND status IN ('Selected', 'Active Intern')`, [m.id]);
      const completed = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE mentor_id = ? AND status = 'Completed'`, [m.id]);
      
      results.push({
        ...m,
        assigned_count: assigned ? assigned.count : 0,
        active_count: active ? active.count : 0,
        completed_count: completed ? completed.count : 0
      });
    }

    return res.json({ success: true, mentors: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Mentor Management - Create Mentor
app.post('/api/admin/mentors', authenticate, requireAdmin, async (req, res) => {
  const { email, password, full_name, domain } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required.' });
  }

  try {
    const exists = await dbGet(`SELECT id FROM mentors WHERE LOWER(email) = LOWER(?)`, [email.trim()]);
    if (exists) {
      return res.status(400).json({ error: 'A mentor with this email already exists.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const time = new Date().toISOString();
    await dbRun(
      `INSERT INTO mentors (email, password_hash, full_name, domain, status, created_at)
       VALUES (?, ?, ?, ?, 'Active', ?)`,
      [email.trim(), hash, full_name.trim(), domain || '', time]
    );

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'admin', 'Create Mentor', ?, ?, ?)`,
      [req.user.email, `Created mentor ${full_name} (${email})`, req.ip || '', time]
    );

    return res.json({ success: true, message: 'Mentor profile created successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Mentor Management - Update Mentor status/domain
app.put('/api/admin/mentors/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { full_name, domain, status } = req.body;

  try {
    const m = await dbGet(`SELECT * FROM mentors WHERE id = ?`, [id]);
    if (!m) return res.status(404).json({ error: 'Mentor not found.' });

    const time = new Date().toISOString();
    await dbRun(
      `UPDATE mentors SET full_name = ?, domain = ?, status = ?, updated_at = ? WHERE id = ?`,
      [full_name.trim(), domain.trim(), status, time, id]
    );

    // Update mentor name in applications
    await dbRun(`UPDATE applications SET mentor_name = ? WHERE mentor_id = ?`, [full_name.trim(), id]);

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'admin', 'Update Mentor', ?, ?, ?)`,
      [req.user.email, `Updated mentor id ${id} metadata`, req.ip || '', time]
    );

    return res.json({ success: true, message: 'Mentor profile updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Mentor Management - Reset Password
app.post('/api/admin/mentors/reset-password', authenticate, requireAdmin, async (req, res) => {
  const { mentor_id, password } = req.body;
  if (!mentor_id || !password) {
    return res.status(400).json({ error: 'Mentor ID and new password are required.' });
  }

  try {
    const m = await dbGet(`SELECT * FROM mentors WHERE id = ?`, [mentor_id]);
    if (!m) return res.status(404).json({ error: 'Mentor not found.' });

    const hash = bcrypt.hashSync(password, 10);
    await dbRun(`UPDATE mentors SET password_hash = ?, updated_at = ? WHERE id = ?`, [hash, new Date().toISOString(), mentor_id]);

    // Log Reset Log
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'admin', 'Reset Mentor Password', ?, ?, ?)`,
      [req.user.email, `Reset password for mentor ${m.email}`, req.ip || '', new Date().toISOString()]
    );

    return res.json({ success: true, message: `Password reset successfully for ${m.full_name}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Intern Assignment - Manual Assignment
app.post('/api/admin/assign-mentor/manual', authenticate, requireAdmin, async (req, res) => {
  const { application_id, mentor_id } = req.body;
  if (!application_id || !mentor_id) {
    return res.status(400).json({ error: 'Application ID and Mentor ID are required.' });
  }

  try {
    const app = await dbGet(`SELECT id, full_name, email FROM applications WHERE application_id = ?`, [application_id]);
    if (!app) return res.status(404).json({ error: 'Intern application record not found.' });

    const mentor = await dbGet(`SELECT id, full_name, email FROM mentors WHERE id = ?`, [mentor_id]);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });

    const time = new Date().toISOString();
    await dbRun(
      `UPDATE applications SET mentor_id = ?, mentor_name = ?, updated_at = ? WHERE application_id = ?`,
      [mentor.id, mentor.full_name, time, application_id]
    );

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'admin', 'Manual Assign Mentor', ?, ?, ?)`,
      [req.user.email, `Assigned mentor ${mentor.full_name} to intern ${app.full_name} (${application_id})`, req.ip || '', time]
    );

    // Notify Intern & Mentor
    await dbRun(
      `INSERT INTO notifications (application_id, role, title, message, type, created_at)
       VALUES (?, 'intern', 'Mentor Assigned', 'Mentor ${mentor.full_name} has been manually assigned to guide you.', 'feedback', ?)`,
      [application_id, time]
    );
    await dbRun(
      `INSERT INTO notifications (mentor_id, role, title, message, type, created_at)
       VALUES (?, 'mentor', 'New Intern Assigned', 'Intern ${app.full_name} (${application_id}) was assigned to you.', 'assignment', ?)`,
      [mentor.id, time]
    );

    return res.json({ success: true, message: `Intern successfully assigned to ${mentor.full_name}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Intern Assignment - Bulk Assignment (Workload Balanced Distribution)
app.post('/api/admin/assign-mentor/bulk', authenticate, requireAdmin, async (req, res) => {
  const { application_ids, mentor_ids } = req.body;
  if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
    return res.status(400).json({ error: 'A valid array of application IDs is required.' });
  }
  if (!mentor_ids || !Array.isArray(mentor_ids) || mentor_ids.length === 0) {
    return res.status(400).json({ error: 'A valid array of mentor IDs is required.' });
  }

  try {
    // 1. Fetch selected mentors
    const mentors = [];
    for (const mId of mentor_ids) {
      const m = await dbGet(`SELECT id, full_name FROM mentors WHERE id = ? AND status = 'Active'`, [mId]);
      if (m) mentors.push(m);
    }

    if (mentors.length === 0) {
      return res.status(400).json({ error: 'No active mentors found for the selected IDs.' });
    }

    // 2. Fetch initial workloads for each mentor to do true load balancing
    const mentorWorkloads = [];
    for (const m of mentors) {
      const row = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE mentor_id = ? AND status IN ('Selected', 'Active Intern')`, [m.id]);
      mentorWorkloads.push({
        mentor: m,
        count: row ? row.count : 0
      });
    }

    const time = new Date().toISOString();
    const assignedLog = [];

    // 3. Process each intern application in bulk, assigning to the mentor with the lowest current workload
    for (const appId of application_ids) {
      const app = await dbGet(`SELECT full_name FROM applications WHERE application_id = ?`, [appId]);
      if (!app) continue;

      // Sort to find mentor with lowest workload count
      mentorWorkloads.sort((a, b) => a.count - b.count);
      const chosen = mentorWorkloads[0];

      // Perform assignment
      await dbRun(
        `UPDATE applications SET mentor_id = ?, mentor_name = ?, updated_at = ? WHERE application_id = ?`,
        [chosen.mentor.id, chosen.mentor.full_name, time, appId]
      );

      // Increment workload count locally to distribute the next ones correctly
      chosen.count++;

      // Notify Intern & Mentor
      await dbRun(
        `INSERT INTO notifications (application_id, role, title, message, type, created_at)
         VALUES (?, 'intern', 'Mentor Assigned', 'Mentor ${chosen.mentor.full_name} has been assigned to guide you.', 'feedback', ?)`,
        [appId, time]
      );
      await dbRun(
        `INSERT INTO notifications (mentor_id, role, title, message, type, created_at)
         VALUES (?, 'mentor', 'New Intern Assigned', 'Intern ${app.full_name} (${appId}) was assigned to you.', 'assignment', ?)`,
        [chosen.mentor.id, time]
      );

      assignedLog.push(`${appId} -> ${chosen.mentor.full_name}`);
    }

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'admin', 'Bulk Assign Mentors', ?, ?, ?)`,
      [req.user.email, `Bulk assigned ${application_ids.length} interns. Distribution details: ${assignedLog.join(', ')}`, req.ip || '', time]
    );

    return res.json({ success: true, message: `Successfully distributed ${application_ids.length} interns among ${mentors.length} mentors.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get List of Interns Assigned to Logged-in Mentor
app.get('/api/mentor/interns', authenticate, requireMentor, async (req, res) => {
  try {
    const query = `
      SELECT id, application_id, full_name, email, preferred_domain, start_date, status, created_at 
      FROM applications 
      WHERE mentor_id = ?
    `;
    const interns = await dbQuery(query, [req.user.id]);
    
    // Add additional progress and report counts for each intern
    const results = [];
    for (const intern of interns) {
      // Calculate report counts
      const reportsCount = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE application_id = ?`, [intern.application_id]);
      const approvedCount = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE application_id = ? AND status = 'Approved'`, [intern.application_id]);
      const pendingReport = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE application_id = ? AND status = 'Pending'`, [intern.application_id]);
      
      // Calculate task progress percentage from project assignment
      const project = await dbGet(`SELECT tasks FROM project_assignments WHERE application_id = ?`, [intern.application_id]);
      let progress = 0;
      if (project && project.tasks) {
        try {
          const tasks = JSON.parse(project.tasks);
          if (tasks.length > 0) {
            const completed = tasks.filter(t => t.status === 'Completed').length;
            progress = Math.round((completed / tasks.length) * 100);
          }
        } catch (e) {
          progress = 0;
        }
      }

      results.push({
        ...intern,
        reports_count: reportsCount ? reportsCount.count : 0,
        approved_reports_count: approvedCount ? approvedCount.count : 0,
        weekly_report_status: (pendingReport && pendingReport.count > 0) ? 'Pending Review' : 'Up to Date',
        progress_percentage: progress
      });
    }

    return res.json({ success: true, interns: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Weekly Reporting - Intern Submit Report
app.post('/api/intern/submit-report', authenticate, requireInternOrAdmin, async (req, res) => {
  const application_id = req.user.application_id;
  const {
    work_completed,
    tasks_accomplished,
    technologies_learned,
    evidence_data,
    evidence_name,
    github_url,
    deployment_url,
    challenges_faced,
    learning_outcome,
    next_week_plan,
    hours_worked
  } = req.body;

  if (!work_completed || !tasks_accomplished || !hours_worked) {
    return res.status(400).json({ error: 'Work completed, tasks accomplished, and hours worked are required.' });
  }

  try {
    // 1. Automatically calculate Week Number
    const existingReports = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE application_id = ?`, [application_id]);
    const week_number = (existingReports ? existingReports.count : 0) + 1;

    // Fetch the assigned mentor
    const app = await dbGet(`SELECT mentor_id FROM applications WHERE application_id = ?`, [application_id]);
    const mentor_id = app ? app.mentor_id : null;

    const time = new Date().toISOString();

    await dbRun(
      `INSERT INTO weekly_reports (
        application_id, week_number, work_completed, tasks_accomplished, technologies_learned,
        evidence_path, evidence_data, github_url, deployment_url, challenges_faced,
        learning_outcome, next_week_plan, hours_worked, status, submitted_at, mentor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        application_id, week_number, work_completed, tasks_accomplished, technologies_learned || '',
        evidence_name || null, evidence_data || null, github_url || '', deployment_url || '', challenges_faced || '',
        learning_outcome || '', next_week_plan || '', parseInt(hours_worked) || 0, time, mentor_id
      ]
    );

    // Create Notification for Mentor
    if (mentor_id) {
      await dbRun(
        `INSERT INTO notifications (mentor_id, role, title, message, type, created_at)
         VALUES (?, 'mentor', 'New Report Submitted', 'Intern ${req.user.full_name} has submitted Weekly Report #${week_number} for review.', 'report_status', ?)`,
        [mentor_id, time]
      );
    }

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'intern', 'Submit Weekly Report', ?, ?, ?)`,
      [req.user.email, `Submitted weekly report #${week_number} with ${hours_worked} hours worked`, req.ip || '', time]
    );

    return res.json({ success: true, message: `Weekly Report #${week_number} submitted successfully.` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Weekly Reporting - Retrieve reports for logged-in Intern
app.get('/api/intern/reports', authenticate, requireInternOrAdmin, async (req, res) => {
  const application_id = req.user.application_id;
  try {
    const reports = await dbQuery(
      `SELECT * FROM weekly_reports WHERE application_id = ? ORDER BY week_number DESC`,
      [application_id]
    );
    return res.json({ success: true, reports });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Weekly Reporting - Get pending reports for Mentor review
app.get('/api/mentor/reports/pending', authenticate, requireMentor, async (req, res) => {
  try {
    const query = `
      SELECT r.*, a.full_name as intern_name, a.preferred_domain as domain
      FROM weekly_reports r
      JOIN applications a ON r.application_id = a.application_id
      WHERE r.mentor_id = ? AND r.status = 'Pending'
      ORDER BY r.submitted_at ASC
    `;
    const reports = await dbQuery(query, [req.user.id]);
    return res.json({ success: true, reports });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Weekly Reporting - Get all reviewed reports history for Mentor
app.get('/api/mentor/reports/reviewed', authenticate, requireMentor, async (req, res) => {
  try {
    const query = `
      SELECT r.*, a.full_name as intern_name, a.preferred_domain as domain
      FROM weekly_reports r
      JOIN applications a ON r.application_id = a.application_id
      WHERE r.mentor_id = ? AND r.status != 'Pending'
      ORDER BY r.reviewed_at DESC
    `;
    const reports = await dbQuery(query, [req.user.id]);
    return res.json({ success: true, reports });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Weekly Reporting - Review Weekly Report (Approve/Reject/Request resubmission)
app.post('/api/mentor/reports/:id/review', authenticate, requireMentor, async (req, res) => {
  const { id } = req.params;
  const { status, feedback, score } = req.body;

  if (!status || !['Approved', 'Rejected', 'Resubmission Required'].includes(status)) {
    return res.status(400).json({ error: 'A valid review status is required.' });
  }

  try {
    const report = await dbGet(`SELECT * FROM weekly_reports WHERE id = ? AND mentor_id = ?`, [id, req.user.id]);
    if (!report) return res.status(404).json({ error: 'Weekly report not found or you are not authorized to review it.' });

    const time = new Date().toISOString();
    const finalScore = score !== undefined ? parseInt(score) : null;

    await dbRun(
      `UPDATE weekly_reports
       SET status = ?, feedback = ?, score = ?, reviewed_at = ?
       WHERE id = ?`,
      [status, feedback || '', finalScore, time, id]
    );

    // Notify Intern
    await dbRun(
      `INSERT INTO notifications (application_id, role, title, message, type, created_at)
       VALUES (?, 'intern', 'Weekly Report Reviewed', 'Your weekly report #${report.week_number} has been marked as ${status}. Feedback: "${feedback || ''}"', 'report_status', ?)`,
      [report.application_id, time]
    );

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, 'mentor', 'Review Weekly Report', ?, ?, ?)`,
      [req.user.email, `Reviewed report id ${id} for intern ${report.application_id} (Status: ${status}, Score: ${finalScore})`, req.ip || '', time]
    );

    return res.json({ success: true, message: `Report review marked as ${status} successfully.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Google Meet scheduler API (Admin or Mentor)
app.post('/api/meetings', authenticate, requireMentorOrAdmin, async (req, res) => {
  const { title, description, meeting_date, meeting_time, meet_link, meeting_type, target_domain, target_mentor_id, target_application_id } = req.body;
  if (!title || !meeting_date || !meeting_time || !meet_link || !meeting_type) {
    return res.status(400).json({ error: 'Meeting Title, Date, Time, Meet link, and Type are required.' });
  }

  try {
    const creator = req.user.role === 'admin' ? 'Manchester Technologies Official' : req.user.full_name;
    const time = new Date().toISOString();

    await dbRun(
      `INSERT INTO meetings (
        title, description, meeting_date, meeting_time, meet_link, meeting_type,
        target_domain, target_mentor_id, target_application_id, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(), description || '', meeting_date, meeting_time, meet_link.trim(), meeting_type,
        target_domain || null, target_mentor_id || null, target_application_id || null, creator, time
      ]
    );

    // Notify target audience
    if (meeting_type === 'All Interns') {
      await dbRun(
        `INSERT INTO notifications (role, title, message, type, created_at)
         VALUES ('intern', 'New Meeting Scheduled', 'A new meeting titled "${title}" has been scheduled for all interns.', 'meeting', ?)`,
        [time]
      );
    } else if (meeting_type === 'Domain Based' && target_domain) {
      await dbRun(
        `INSERT INTO notifications (role, title, message, type, created_at)
         VALUES ('intern', 'Domain Meeting Scheduled', 'A meeting has been scheduled for ${target_domain} interns: "${title}".', 'meeting', ?)`,
        [time]
      );
    } else if (meeting_type === 'Group Based' && target_mentor_id) {
      await dbRun(
        `INSERT INTO notifications (mentor_id, role, title, message, type, created_at)
         VALUES (?, 'intern', 'Mentor Group Meeting', 'Your mentor has scheduled a group sync: "${title}".', 'meeting', ?)`,
        [target_mentor_id, time]
      );
    } else if (meeting_type === 'Individual Intern' && target_application_id) {
      await dbRun(
        `INSERT INTO notifications (application_id, role, title, message, type, created_at)
         VALUES (?, 'intern', 'One-on-One Meeting', 'A 1:1 meeting has been scheduled for you: "${title}".', 'meeting', ?)`,
        [target_application_id, time]
      );
    }

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, ?, 'Schedule Meeting', ?, ?, ?)`,
      [req.user.email, req.user.role, `Scheduled meeting "${title}" of type ${meeting_type}`, req.ip || '', time]
    );

    return res.json({ success: true, message: 'Meeting scheduled successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Retrieve Meetings list for target user
app.get('/api/meetings', authenticate, async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'admin') {
      query = `SELECT * FROM meetings ORDER BY meeting_date ASC, meeting_time ASC`;
    } else if (req.user.role === 'mentor') {
      query = `
        SELECT * FROM meetings 
        WHERE meeting_type = 'All Interns' 
           OR target_mentor_id = ? 
           OR created_by = ?
        ORDER BY meeting_date ASC, meeting_time ASC
      `;
      params = [req.user.id, req.user.full_name];
    } else { // Intern
      const app = await dbGet(`SELECT preferred_domain, mentor_id FROM applications WHERE application_id = ?`, [req.user.application_id]);
      const domain = app ? app.preferred_domain : '';
      const mentorId = app ? app.mentor_id : 0;

      query = `
        SELECT * FROM meetings 
        WHERE meeting_type = 'All Interns'
           OR (meeting_type = 'Domain Based' AND LOWER(target_domain) = LOWER(?))
           OR (meeting_type = 'Group Based' AND target_mentor_id = ?)
           OR (meeting_type = 'Individual Intern' AND target_application_id = ?)
        ORDER BY meeting_date ASC, meeting_time ASC
      `;
      params = [domain, mentorId, req.user.application_id];
    }

    const meetings = await dbQuery(query, params);
    return res.json({ success: true, meetings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Mark Attendance for a Meeting
app.post('/api/meetings/:id/attendance', authenticate, requireMentorOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { attendanceRoster } = req.body; 

  if (!attendanceRoster || !Array.isArray(attendanceRoster)) {
    return res.status(400).json({ error: 'A valid attendance roster array is required.' });
  }

  try {
    const meeting = await dbGet(`SELECT * FROM meetings WHERE id = ?`, [id]);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });

    const marker = req.user.role === 'admin' ? 'Admin' : req.user.full_name;
    const time = new Date().toISOString();

    for (const record of attendanceRoster) {
      const exists = await dbGet(`SELECT id FROM attendance WHERE meeting_id = ? AND application_id = ?`, [id, record.application_id]);
      if (exists) {
        await dbRun(
          `UPDATE attendance SET status = ?, marked_by = ?, marked_at = ? WHERE id = ?`,
          [record.status, marker, time, exists.id]
        );
      } else {
        await dbRun(
          `INSERT INTO attendance (meeting_id, application_id, status, marked_by, marked_at)
           VALUES (?, ?, ?, ?, ?)`,
          [id, record.application_id, record.status, marker, time]
        );
      }
    }

    return res.json({ success: true, message: 'Attendance registered successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get Attendance Roster for a Meeting
app.get('/api/meetings/:id/attendance', authenticate, requireMentorOrAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await dbGet(`SELECT * FROM meetings WHERE id = ?`, [id]);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });

    const attendance = await dbQuery(`SELECT * FROM attendance WHERE meeting_id = ?`, [id]);
    
    let eligibleInterns = [];
    if (meeting.meeting_type === 'All Interns') {
      eligibleInterns = await dbQuery(`SELECT application_id, full_name, email, preferred_domain FROM applications WHERE status IN ('Selected', 'Active Intern')`);
    } else if (meeting.meeting_type === 'Domain Based' && meeting.target_domain) {
      eligibleInterns = await dbQuery(`SELECT application_id, full_name, email, preferred_domain FROM applications WHERE status IN ('Selected', 'Active Intern') AND LOWER(preferred_domain) = LOWER(?)`, [meeting.target_domain]);
    } else if (meeting.meeting_type === 'Group Based' && meeting.target_mentor_id) {
      eligibleInterns = await dbQuery(`SELECT application_id, full_name, email, preferred_domain FROM applications WHERE status IN ('Selected', 'Active Intern') AND mentor_id = ?`, [meeting.target_mentor_id]);
    } else if (meeting.meeting_type === 'Individual Intern' && meeting.target_application_id) {
      eligibleInterns = await dbQuery(`SELECT application_id, full_name, email, preferred_domain FROM applications WHERE application_id = ?`, [meeting.target_application_id]);
    }

    const roster = eligibleInterns.map(intern => {
      const att = attendance.find(a => a.application_id === intern.application_id);
      return {
        ...intern,
        status: att ? att.status : 'Unmarked',
        marked_at: att ? att.marked_at : null
      };
    });

    return res.json({ success: true, roster });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Announcement System - Create Announcement (Admin or Mentor)
app.post('/api/announcements', authenticate, requireMentorOrAdmin, async (req, res) => {
  const { title, message, meet_link, audience_type, target_domain, target_mentor_id, attachment_name, attachment_data } = req.body;
  if (!title || !message || !audience_type) {
    return res.status(400).json({ error: 'Title, message, and audience type are required.' });
  }

  try {
    const creator = req.user.role === 'admin' ? 'Manchester Technologies Official' : req.user.full_name;
    const time = new Date().toISOString();

    await dbRun(
      `INSERT INTO announcements (
        title, message, meet_link, audience_type, target_domain, target_mentor_id,
        attachment_path, attachment_data, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(), message.trim(), meet_link || null, audience_type, target_domain || null, target_mentor_id || null,
        attachment_name || null, attachment_data || null, creator, time
      ]
    );

    // Push notification to target audience
    await dbRun(
      `INSERT INTO notifications (role, title, message, type, created_at)
       VALUES ('intern', 'Broadcasting Notice: ' || ?, ?, 'announcement', ?)`,
      [title, message.substring(0, 150), time]
    );

    // Log Activity
    await dbRun(
      `INSERT INTO activity_logs (user_id, role, action, details, ip_address, created_at)
       VALUES (?, ?, 'Create Announcement', ?, ?, ?)`,
      [req.user.email, req.user.role, `Created announcement "${title}"`, req.ip || '', time]
    );

    return res.json({ success: true, message: 'Announcement broadcasted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// View Announcements list
app.get('/api/announcements', authenticate, async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'admin') {
      query = `SELECT * FROM announcements ORDER BY created_at DESC`;
    } else if (req.user.role === 'mentor') {
      query = `
        SELECT * FROM announcements 
        WHERE audience_type = 'All Interns' 
           OR target_mentor_id = ? 
           OR created_by = ?
        ORDER BY created_at DESC
      `;
      params = [req.user.id, req.user.full_name];
    } else { // Intern
      const app = await dbGet(`SELECT preferred_domain, mentor_id FROM applications WHERE application_id = ?`, [req.user.application_id]);
      const domain = app ? app.preferred_domain : '';
      const mentorId = app ? app.mentor_id : 0;

      query = `
        SELECT * FROM announcements 
        WHERE audience_type = 'All Interns'
           OR (audience_type = 'Domain' AND LOWER(target_domain) = LOWER(?))
           OR (audience_type = 'Group' AND target_mentor_id = ?)
        ORDER BY created_at DESC
      `;
      params = [domain, mentorId];
    }

    const announcements = await dbQuery(query, params);
    return res.json({ success: true, announcements });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Group Communication System - Messages
app.get('/api/communication/channels/:type/:name/messages', authenticate, async (req, res) => {
  const { type, name } = req.params;
  try {
    const messages = await dbQuery(
      `SELECT * FROM group_messages WHERE channel_type = ? AND channel_name = ? ORDER BY created_at ASC LIMIT 100`,
      [type, name]
    );
    return res.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/communication/channels/:type/:name/messages', authenticate, async (req, res) => {
  const { type, name } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    const time = new Date().toISOString();
    let senderId = '';
    let senderName = '';
    let senderRole = req.user.role;

    if (req.user.role === 'admin') {
      senderId = 'admin';
      senderName = 'Manchester Technologies Official';
    } else if (req.user.role === 'mentor') {
      senderId = String(req.user.id);
      senderName = req.user.full_name;
    } else { // Intern
      senderId = req.user.application_id;
      senderName = req.user.full_name;
    }

    await dbRun(
      `INSERT INTO group_messages (channel_type, channel_name, sender_id, sender_name, sender_role, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, name, senderId, senderName, senderRole, message.trim(), time]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Notifications Endpoint
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    let notifications = [];
    if (req.user.role === 'admin') {
      notifications = await dbQuery(`SELECT * FROM notifications WHERE role = 'admin' ORDER BY created_at DESC LIMIT 50`);
    } else if (req.user.role === 'mentor') {
      notifications = await dbQuery(
        `SELECT * FROM notifications WHERE (role = 'mentor' AND (mentor_id = ? OR mentor_id IS NULL)) ORDER BY created_at DESC LIMIT 50`,
        [req.user.id]
      );
    } else { // Intern
      notifications = await dbQuery(
        `SELECT * FROM notifications WHERE (role = 'intern' AND (application_id = ? OR application_id IS NULL)) ORDER BY created_at DESC LIMIT 50`,
        [req.user.application_id]
      );
    }
    return res.json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/notifications/read', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      await dbRun(`UPDATE notifications SET is_read = 1 WHERE role = 'admin'`);
    } else if (req.user.role === 'mentor') {
      await dbRun(`UPDATE notifications SET is_read = 1 WHERE role = 'mentor' AND (mentor_id = ? OR mentor_id IS NULL)`, [req.user.id]);
    } else { // Intern
      await dbRun(`UPDATE notifications SET is_read = 1 WHERE role = 'intern' AND (application_id = ? OR application_id IS NULL)`, [req.user.application_id]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Real-Time Notification Polling Endpoint (Lightweight Socket.IO alternative for serverless VM hosts)
app.get('/api/notifications/poll', authenticate, async (req, res) => {
  const { since } = req.query; // timestamp
  try {
    let messagesQuery = '';
    let notificationsQuery = '';
    let params = [since || ''];

    if (req.user.role === 'admin') {
      notificationsQuery = `SELECT * FROM notifications WHERE role = 'admin' AND created_at > ? ORDER BY created_at ASC`;
      messagesQuery = `SELECT * FROM group_messages WHERE created_at > ? ORDER BY created_at ASC`;
      
      const newNotifs = await dbQuery(notificationsQuery, params);
      const newMsgs = await dbQuery(messagesQuery, params);
      return res.json({ success: true, newNotifications: newNotifs, newMessages: newMsgs });
    } else if (req.user.role === 'mentor') {
      notificationsQuery = `SELECT * FROM notifications WHERE role = 'mentor' AND (mentor_id = ? OR mentor_id IS NULL) AND created_at > ? ORDER BY created_at ASC`;
      messagesQuery = `
        SELECT * FROM group_messages 
        WHERE created_at > ? 
          AND (channel_type = 'Global' 
           OR (channel_type = 'Domain' AND LOWER(channel_name) = LOWER(?))
           OR (channel_type = 'Mentor' AND channel_name = ?))
        ORDER BY created_at ASC
      `;
      const mentor = await dbGet(`SELECT domain FROM mentors WHERE id = ?`, [req.user.id]);
      const domain = mentor ? mentor.domain : '';
      
      const newNotifs = await dbQuery(notificationsQuery, [req.user.id, since || '']);
      const newMsgs = await dbQuery(messagesQuery, [since || '', domain, `MentorGroup-${req.user.id}`]);
      return res.json({ success: true, newNotifications: newNotifs, newMessages: newMsgs });
    } else { // Intern
      const app = await dbGet(`SELECT preferred_domain, mentor_id FROM applications WHERE application_id = ?`, [req.user.application_id]);
      const domain = app ? app.preferred_domain : '';
      const mentorId = app ? app.mentor_id : 0;

      notificationsQuery = `SELECT * FROM notifications WHERE role = 'intern' AND (application_id = ? OR application_id IS NULL) AND created_at > ? ORDER BY created_at ASC`;
      messagesQuery = `
        SELECT * FROM group_messages 
        WHERE created_at > ? 
          AND (channel_type = 'Global' 
           OR (channel_type = 'Domain' AND LOWER(channel_name) = LOWER(?))
           OR (channel_type = 'Mentor' AND channel_name = ?))
        ORDER BY created_at ASC
      `;
      
      const newNotifs = await dbQuery(notificationsQuery, [req.user.application_id, since || '']);
      const newMsgs = await dbQuery(messagesQuery, [since || '', domain, `MentorGroup-${mentorId}`]);
      return res.json({ success: true, newNotifications: newNotifs, newMessages: newMsgs });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Chronological Activity Timeline log
app.get('/api/intern/timeline', authenticate, requireInternOrAdmin, async (req, res) => {
  const application_id = req.user.role === 'admin' ? req.query.application_id : req.user.application_id;
  if (!application_id) return res.status(400).json({ error: 'Application ID is required.' });

  try {
    const timeline = [];

    // 1. Fetch application details
    const app = await dbGet(`SELECT created_at, termsAccepted, signedAt FROM applications WHERE application_id = ?`, [application_id]);
    if (!app) return res.status(404).json({ error: 'Intern not found.' });

    timeline.push({
      event: 'Internship Joined',
      description: 'Submitted application and registered in Manchester Technologies database.',
      timestamp: app.created_at
    });

    if (app.termsAccepted && app.signedAt) {
      timeline.push({
        event: 'Offer Accepted & Agreement Signed',
        description: 'Accepted terms and conditions and digitally signed the internship agreement.',
        timestamp: app.signedAt
      });
    }

    // 2. Fetch weekly reports
    const reports = await dbQuery(`SELECT week_number, status, submitted_at, reviewed_at FROM weekly_reports WHERE application_id = ?`, [application_id]);
    for (const rep of reports) {
      timeline.push({
        event: `Weekly Report #${rep.week_number} Submitted`,
        description: `Logged work status (Review Status: ${rep.status})`,
        timestamp: rep.submitted_at
      });

      if (rep.reviewed_at) {
        timeline.push({
          event: `Weekly Report #${rep.week_number} Reviewed`,
          description: `Mentor completed evaluation (Result: ${rep.status})`,
          timestamp: rep.reviewed_at
        });
      }
    }

    // 3. Fetch meetings attended
    const attendance = await dbQuery(
      `SELECT a.status, a.marked_at, m.title 
       FROM attendance a
       JOIN meetings m ON a.meeting_id = m.id
       WHERE a.application_id = ?`,
      [application_id]
    );
    for (const att of attendance) {
      timeline.push({
        event: `Meeting Attendance: ${att.status}`,
        description: `Checked in for scheduled session "${att.title}"`,
        timestamp: att.marked_at
      });
    }

    // 4. Fetch certificate generated
    const cert = await dbGet(`SELECT created_at, certificate_number FROM certificates WHERE application_id = ?`, [application_id]);
    if (cert) {
      timeline.push({
        event: 'Certificate Generated',
        description: `Completed internship. Standard Certificate generated: ${cert.certificate_number}`,
        timestamp: cert.created_at
      });
    }

    // Sort chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({ success: true, timeline });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Performance Scoring calculations
app.get('/api/intern/performance-metrics', authenticate, requireInternOrAdmin, async (req, res) => {
  const application_id = req.user.role === 'admin' ? req.query.application_id : req.user.application_id;
  if (!application_id) return res.status(400).json({ error: 'Application ID is required.' });

  try {
    // 1. Weekly Report Score (Avg Score of approved reports)
    const reports = await dbQuery(`SELECT score FROM weekly_reports WHERE application_id = ? AND status = 'Approved'`, [application_id]);
    let reportAvg = 0;
    if (reports.length > 0) {
      const totalScore = reports.reduce((sum, r) => sum + (r.score || 0), 0);
      reportAvg = Math.round(totalScore / reports.length);
    } else {
      const anyReports = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE application_id = ?`, [application_id]);
      reportAvg = (anyReports && anyReports.count > 0) ? 75 : 0;
    }

    // 2. Attendance Score (Attendance % based on meetings)
    const meetingsCount = await dbGet(
      `SELECT COUNT(*) as count FROM attendance WHERE application_id = ?`,
      [application_id]
    );
    const presentCount = await dbGet(
      `SELECT COUNT(*) as count FROM attendance WHERE application_id = ? AND status = 'Present'`,
      [application_id]
    );
    const attendancePercent = (meetingsCount && meetingsCount.count > 0)
      ? Math.round((presentCount.count / meetingsCount.count) * 100)
      : 100; // default 100 if no meetings yet

    // 3. Project Task Score
    const project = await dbGet(`SELECT tasks FROM project_assignments WHERE application_id = ?`, [application_id]);
    let taskPercent = 0;
    if (project && project.tasks) {
      try {
        const tasks = JSON.parse(project.tasks);
        if (tasks.length > 0) {
          const completed = tasks.filter(t => t.status === 'Completed').length;
          taskPercent = Math.round((completed / tasks.length) * 100);
        } else {
          taskPercent = 100;
        }
      } catch (e) {
        taskPercent = 0;
      }
    } else {
      taskPercent = 0;
    }

    // Calculate Overall Performance Score (Average)
    const overallScore = Math.round((reportAvg + attendancePercent + taskPercent) / 3);

    return res.json({
      success: true,
      metrics: {
        weekly_report_score: reportAvg,
        attendance_score: attendancePercent,
        task_completion_score: taskPercent,
        overall_score: overallScore
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Advanced Analytics Dashboard calculations
app.get('/api/admin/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalInterns = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE status IN ('Selected', 'Active Intern', 'Completed')`);
    const activeInterns = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE status = 'Active Intern'`);
    
    const totalAttRecords = await dbGet(`SELECT COUNT(*) as count FROM attendance`);
    const presentAttRecords = await dbGet(`SELECT COUNT(*) as count FROM attendance WHERE status = 'Present'`);
    const attendanceRate = (totalAttRecords && totalAttRecords.count > 0)
      ? Math.round((presentAttRecords.count / totalAttRecords.count) * 100)
      : 85; 

    const totalReports = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports`);
    const reviewedReports = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE status != 'Pending'`);
    const mentorReviewRate = (totalReports && totalReports.count > 0)
      ? Math.round((reviewedReports.count / totalReports.count) * 100)
      : 95; 

    const domains = await dbQuery(
      `SELECT preferred_domain as domain, COUNT(*) as count 
       FROM applications 
       WHERE status IN ('Selected', 'Active Intern', 'Completed')
       GROUP BY preferred_domain`
    );

    const mentors = await dbQuery(`SELECT id, full_name FROM mentors`);
    const mentorInternCounts = [];
    for (const m of mentors) {
      const countRow = await dbGet(`SELECT COUNT(*) as count FROM applications WHERE mentor_id = ?`, [m.id]);
      mentorInternCounts.push({
        mentor_name: m.full_name,
        count: countRow ? countRow.count : 0
      });
    }

    const interns = await dbQuery(
      `SELECT application_id, full_name, preferred_domain FROM applications WHERE status IN ('Selected', 'Active Intern') LIMIT 15`
    );
    const rankings = [];
    for (const intern of interns) {
      const reports = await dbQuery(`SELECT score FROM weekly_reports WHERE application_id = ? AND status = 'Approved'`, [intern.application_id]);
      let reportAvg = reports.length > 0 ? reports.reduce((sum, r) => sum + (r.score || 0), 0) / reports.length : 80;
      
      const presentCount = await dbGet(`SELECT COUNT(*) as count FROM attendance WHERE application_id = ? AND status = 'Present'`, [intern.application_id]);
      const totalCount = await dbGet(`SELECT COUNT(*) as count FROM attendance WHERE application_id = ?`, [intern.application_id]);
      let attScore = (totalCount && totalCount.count > 0) ? (presentCount.count / totalCount.count) * 100 : 90;

      const score = Math.round((reportAvg + attScore) / 2);
      rankings.push({
        application_id: intern.application_id,
        full_name: intern.full_name,
        domain: intern.preferred_domain,
        score
      });
    }

    const topRankings = [...rankings].sort((a, b) => b.score - a.score).slice(0, 5);
    const bottomRankings = [...rankings].sort((a, b) => a.score - b.score).slice(0, 5);

    const mentorPerformers = [];
    for (const m of mentors) {
      const totalRep = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE mentor_id = ?`, [m.id]);
      const reviewedRep = await dbGet(`SELECT COUNT(*) as count FROM weekly_reports WHERE mentor_id = ? AND status != 'Pending'`, [m.id]);
      const rate = (totalRep && totalRep.count > 0) ? Math.round((reviewedRep.count / totalRep.count) * 100) : 100;
      mentorPerformers.push({
        mentor_name: m.full_name,
        completion_rate: rate,
        total_reports: totalRep ? totalRep.count : 0
      });
    }
    mentorPerformers.sort((a, b) => b.completion_rate - a.completion_rate);

    return res.json({
      success: true,
      analytics: {
        total_interns: totalInterns ? totalInterns.count : 0,
        active_interns: activeInterns ? activeInterns.count : 0,
        submission_rate: totalReports && totalReports.count > 0 ? Math.round((reviewedReports.count / totalReports.count) * 100) : 80,
        attendance_rate: attendanceRate,
        mentor_review_rate: mentorReviewRate,
        domains_distribution: domains,
        mentors_distribution: mentorInternCounts,
        top_rankings: topRankings,
        bottom_rankings: bottomRankings,
        best_mentor: mentorPerformers[0] || { mentor_name: 'None', completion_rate: 100 }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
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
