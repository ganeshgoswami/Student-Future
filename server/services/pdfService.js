import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { uploadImage } from './cloudinaryService.js';

/**
 * Generates a completion certificate PDF and returns its hosted URL or path.
 * @param {Object} student - Student User object
 * @param {Object} test - Test configuration object
 * @param {Object} result - Result calculation scorecard
 * @param {String} certificateId - Unique certificate ID string
 * @returns {Promise<String>} - URL/path of the generated certificate PDF
 */
export async function generateCertificatePDF(student, test, result, certificateId) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      // Temporary local path for generation
      const tempFilename = `cert_${certificateId}_temp.pdf`;
      const tempPath = path.join(process.cwd(), tempFilename);
      const writeStream = fs.createWriteStream(tempPath);
      doc.pipe(writeStream);

      // --- Draw Background border ---
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(5)
         .stroke('#6d28d9'); // Purple border

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(1)
         .stroke('#a78bfa'); // Inner fine border

      // --- Draw Background Watermark Pattern ---
      doc.save();
      doc.opacity(0.04);
      doc.fillColor('#6d28d9');
      for (let i = 0; i < doc.page.width; i += 100) {
        for (let j = 0; j < doc.page.height; j += 100) {
          doc.fontSize(12).text('STUDENTFUTURE', i, j, { rotation: 30 });
        }
      }
      doc.restore();

      // --- Header text ---
      doc.moveDown(2);
      doc.fillColor('#6d28d9')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF ACHIEVEMENT', { align: 'center' });

      doc.moveDown(0.5);
      doc.fillColor('#4b5563')
         .fontSize(14)
         .font('Helvetica')
         .text('This is proudly presented to', { align: 'center' });

      // --- Student name ---
      doc.moveDown(1);
      doc.fillColor('#1f2937')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(`${student.firstName} ${student.lastName}`, { align: 'center' });
      
      // Draw underline under student name
      const textWidth = doc.widthOfString(`${student.firstName} ${student.lastName}`);
      const startX = (doc.page.width - textWidth) / 2;
      doc.moveTo(startX, doc.y)
         .lineTo(startX + textWidth, doc.y)
         .lineWidth(2)
         .stroke('#8c52ff');

      doc.moveDown(1.5);
      doc.fillColor('#4b5563')
         .fontSize(14)
         .font('Helvetica')
         .text('for successfully passing the online assessment', { align: 'center' });

      // --- Test title ---
      doc.moveDown(0.5);
      doc.fillColor('#6d28d9')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text(`"${test.title}"`, { align: 'center' });

      // --- Stats summary ---
      doc.moveDown(1.25);
      doc.fillColor('#374151')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`Grade Score: ${result.percentage}%  |  Net Marks: ${result.netMarks} of ${result.totalPossibleMarks}  |  Completion Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

      // --- Footers & Signatures ---
      doc.moveDown(3);
      
      const sigY = doc.y;
      
      // Left side: Verification ID
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .text(`Certificate ID: ${certificateId}`, 80, sigY);
      
      // Right side: Authority Signature
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('StudentFuture Examination Board', doc.page.width - 280, sigY, { align: 'center' });
      
      doc.moveTo(doc.page.width - 260, sigY - 5)
         .lineTo(doc.page.width - 100, sigY - 5)
         .lineWidth(1)
         .stroke('#9ca3af');

      doc.end();

      writeStream.on('finish', async () => {
        try {
          // Construct file wrapper object mimicking multer uploads
          const uploadFile = {
            path: tempPath,
            originalname: `cert_${certificateId}.pdf`,
            filename: `cert_${certificateId}`
          };
          
          // Upload using Cloudinary or local fallback
          const url = await uploadImage(uploadFile, 'certificates');
          
          // Delete temp file if it still exists locally (e.g. uploadImage didn't unlink it)
          fs.unlink(tempPath, () => {});
          
          resolve(url);
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}
