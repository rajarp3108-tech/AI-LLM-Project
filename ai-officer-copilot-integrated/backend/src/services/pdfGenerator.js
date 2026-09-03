import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('generated');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function slugify(text) {
  return String(text || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'document';
}

/**
 * Generates a simple, clean PDF from a title + body text and saves it to
 * /generated. Returns { fileId, filePath, url } — url is the path the
 * frontend can fetch/download from (server.js serves /generated as /files).
 */
export function generatePdf({ title, content }) {
  return new Promise((resolve, reject) => {
    const fileId = `${slugify(title)}-${Date.now()}.pdf`;
    const filePath = path.join(OUT_DIR, fileId);

    const doc = new PDFDocument({ margin: 56 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(20).text(title || 'Document', { align: 'left' });
    doc.moveDown(0.3);
    doc.strokeColor('#B8892B').lineWidth(1.5)
      .moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(11).fillColor('#22262E')
      .text(content || '', { align: 'left', lineGap: 5 });

    doc.end();
    stream.on('finish', () => resolve({ fileId, filePath, url: `/files/${fileId}` }));
    stream.on('error', reject);
  });
}