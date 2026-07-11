import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'manchestertechnologiestandc.pdf');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

function generatePDF() {
  console.log('Generating Terms & Conditions PDF...');
  
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // Document Styling Constants
  const primaryColor = '#C8A96A'; // Gold
  const darkColor = '#1A1A1A';
  const grayColor = '#555555';

  // Helper to draw header
  const drawHeader = (pageNumber) => {
    doc.fillColor(primaryColor).rect(0, 0, 595.28, 15).fill();
    doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10)
       .text('MANCHESTER TECHNOLOGIES', 50, 30, { align: 'left' });
    doc.fillColor(grayColor).font('Helvetica').fontSize(8)
       .text(`Internship Program Terms & Conditions | Page ${pageNumber}`, 50, 30, { align: 'right' });
    doc.strokeColor('#E5E5E5').lineWidth(0.5).moveTo(50, 42).lineTo(545.28, 42).stroke();
  };

  // Helper to draw footer
  const drawFooter = () => {
    doc.strokeColor('#E5E5E5').lineWidth(0.5).moveTo(50, 785).lineTo(545.28, 785).stroke();
    doc.fillColor(grayColor).font('Helvetica').fontSize(8)
       .text('Confidential - For Selected Candidates Only. © Manchester Technologies 2026.', 50, 792, { align: 'center' });
  };

  // --- PAGE 1: INTRODUCTION & RULES ---
  drawHeader(1);
  
  doc.y = 60;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(20)
     .text('INTERNSHIP TERMS & CONDITIONS', { align: 'center' });
  
  doc.y = 90;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('Welcome to the Manchester Technologies Internship Program. This document outlines the legal terms, duties, code of conduct, and intellectual property agreements that govern your participation as an intern with us. Please read these terms carefully before accepting the offer and providing your digital signature.', { leading: 14 });

  doc.y = 150;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('1. SCOPE AND NATURE OF INTERNSHIP');
  doc.y = 165;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('The internship is designed to provide you with practical experience, professional training, and mentorship in your selected technology domain. It is an educational program, and your participation does not guarantee future full-time employment at Manchester Technologies. You are expected to fulfill the tasks assigned by your mentor in a timely manner and adhere to the scheduled project timelines.');

  doc.y = 235;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('2. INTELLECTUAL PROPERTY RIGHTS');
  doc.y = 250;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('All work products, codebases, designs, documentation, repositories, tools, data, algorithms, and applications created, written, or developed by you, either individually or jointly with others, during the course of your internship with Manchester Technologies, shall be the sole and exclusive property of Manchester Technologies. You hereby assign all rights, titles, and interests in and to such intellectual property to the company. You agree not to copy, upload, distribute, or otherwise use these repositories or intellectual property outside the scope of your internship tasks without explicit written authorization.');

  doc.y = 350;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('3. CODE OF CONDUCT AND DISCIPLINE');
  doc.y = 365;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('As an intern, you represent Manchester Technologies. You are required to maintain the highest standards of professional conduct, integrity, and respect toward team members, mentors, and administrators. Manchester Technologies reserves the right to terminate your internship immediately without compensation or certificate issuance in cases of misconduct, plagiarism, lack of progress, unauthorized sharing of work, or violation of internal policies.');

  drawFooter();

  // --- PAGE 2: CONFIDENTIALITY & DATA PROTECTION ---
  doc.addPage();
  drawHeader(2);

  doc.y = 60;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('4. CONFIDENTIALITY AGREEMENT (NON-DISCLOSURE)');
  doc.y = 75;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('During your internship, you may have access to proprietary information, trade secrets, business processes, client lists, customer information, internal credentials, staging links, and source code. All such details constitute "Confidential Information" and must be kept strictly confidential. You shall not disclose, print, or distribute any Confidential Information to any third party, family members, or on social media platforms (including but not limited to LinkedIn, GitHub, and Twitter) during or after your internship. Your obligations under this section shall survive the termination of your internship indefinitely.');

  doc.y = 175;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('5. WORK HOURS AND TIMELINE ASSIGNMENT');
  doc.y = 190;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('You are required to dedicate the minimum agreed hours per day to your assigned tasks and participate in status checks or milestone updates as requested by your mentor. Failure to demonstrate consistent activity or update progress in the Intern Workspace for five (5) consecutive working days without prior approved leave may result in automatic deletion of your internship allocation and certificate revocation.');

  doc.y = 265;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('6. STIPEND AND COMPENSATION CONDITIONS');
  doc.y = 280;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('Any stipend, compensation, or reimbursement associated with your internship, if applicable, is strictly contingent upon satisfactory and complete fulfillment of all assigned tasks, final project review approval by your mentor, and successful submission of the final internship documentation. No partial stipend will be paid for incomplete or terminated internships.');

  drawFooter();

  // --- PAGE 3: CERTIFICATION & TERMINATION ---
  doc.addPage();
  drawHeader(3);

  doc.y = 60;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('7. INTERNSHIP CERTIFICATE ISSUANCE');
  doc.y = 75;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('An internship completion certificate will be generated and issued to you only after: (a) completion of the entire duration of the internship; (b) successful completion of all assigned checklist items; (c) approval of your code reviews and mentor feedback; and (d) successful return of all digital assets or documentation. The certificate will feature a unique, verified QR code logged permanently in the Manchester Technologies verification ledger.');

  doc.y = 160;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('8. LIMITATION OF LIABILITY AND INDEMNITY');
  doc.y = 175;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('Manchester Technologies shall not be held liable for any damages, losses, or injuries sustained by you during the internship, whether physical, financial, or technical. You agree to defend, indemnify, and hold harmless Manchester Technologies, its directors, officers, employees, and agents from any claims, liability, damages, or costs arising out of your negligence, misconduct, or breach of these terms.');

  doc.y = 245;
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12)
     .text('9. ACCEPTANCE AND ACKNOWLEDGMENT');
  doc.y = 260;
  doc.fillColor(darkColor).font('Helvetica').fontSize(10)
     .text('By signing this document digitally through the Manchester Technologies Portal, you acknowledge that you have read, understood, and agreed to all the rules, conditions, confidentiality regulations, and intellectual property rights described herein. Your digital signature serves as a legally binding acceptance of these Terms & Conditions.');

  doc.y = 350;
  doc.fillColor(grayColor).font('Helvetica-Oblique').fontSize(9)
     .text('Note: This is page 3 of the Terms & Conditions. The signature block, candidate information, IP audit records, and timestamp will be appended dynamically to create the finalized Signed Internship Agreement PDF upon successful submission.');

  drawFooter();

  doc.end();
  
  stream.on('finish', () => {
    console.log(`✅ Terms & Conditions PDF created successfully at: ${OUTPUT_PATH}`);
  });
}

generatePDF();
