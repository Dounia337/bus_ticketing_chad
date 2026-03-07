/**
 * Ticket Service
 * Generates PDF tickets and text tickets for WhatsApp
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

/**
 * Generate PDF ticket
 * @param {object} bookingData - Booking details
 * @param {string} outputPath - File output path
 * @returns {Promise<string>} Path to generated PDF
 */
const generatePDFTicket = async (bookingData, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('CHAD BUS', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(18)
         .text('BILLET DE VOYAGE', { align: 'center' })
         .moveDown(1);
      
      // Generate QR code for booking code
      const qrCodeDataUrl = await QRCode.toDataURL(bookingData.bookingCode);
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      
      doc.image(qrBuffer, doc.page.width / 2 - 50, doc.y, { width: 100 });
      doc.moveDown(6);
      
      // Booking code
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(`Code de réservation: ${bookingData.bookingCode}`, { align: 'center' })
         .moveDown(1);
      
      // Draw horizontal line
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(1);
      
      // Booking details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('DÉTAILS DU VOYAGE', { underline: true })
         .moveDown(0.5);
      
      doc.font('Helvetica');
      
      // Route info
      doc.text(`Trajet: ${bookingData.route.originCity} → ${bookingData.route.destinationCity}`);
      doc.text(`Date de départ: ${bookingData.departureDate}`);
      doc.text(`Heure de départ: ${bookingData.departureTime}`);
      
      if (bookingData.boardingPoint) {
        doc.text(`Point d'embarquement: ${bookingData.boardingPoint}`);
      }
      
      doc.moveDown(1);
      
      // Passenger details
      doc.font('Helvetica-Bold')
         .text('PASSAGERS', { underline: true })
         .moveDown(0.5);
      
      doc.font('Helvetica');
      bookingData.passengers.forEach((passenger, index) => {
        doc.text(`${index + 1}. ${passenger.fullName} - Place ${passenger.seatNumber}`);
      });
      
      doc.moveDown(1);
      
      // Bus details
      doc.font('Helvetica-Bold')
         .text('INFORMATIONS BUS', { underline: true })
         .moveDown(0.5);
      
      doc.font('Helvetica');
      doc.text(`Numéro de bus: ${bookingData.bus.busNumber}`);
      
      if (bookingData.bus.plateNumber) {
        doc.text(`Plaque: ${bookingData.bus.plateNumber}`);
      }
      
      doc.moveDown(1);
      
      // Luggage info
      if (bookingData.luggage) {
        doc.font('Helvetica-Bold')
           .text('BAGAGES', { underline: true })
           .moveDown(0.5);
        
        doc.font('Helvetica');
        doc.text(`Nombre de bagages: ${bookingData.luggage.numberOfBags}`);
        doc.text(`Poids estimé: ${bookingData.luggage.estimatedWeight} kg`);
        
        if (bookingData.luggage.totalExtraFee > 0) {
          doc.text(`Frais supplémentaires: ${bookingData.luggage.totalExtraFee} FCFA`);
        }
        
        doc.moveDown(1);
      }
      
      // Payment info
      doc.font('Helvetica-Bold')
         .text('PAIEMENT', { underline: true })
         .moveDown(0.5);
      
      doc.font('Helvetica');
      doc.text(`Montant total: ${bookingData.totalPrice} FCFA`);
      doc.text(`Statut: ${bookingData.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}`);
      
      doc.moveDown(2);
      
      // Footer
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Conditions importantes:', { continued: false })
         .fontSize(9)
         .text('• Présentez-vous 30 minutes avant le départ')
         .text('• Pièce d\'identité requise')
         .text('• Bagages limités selon les règles de la compagnie')
         .text('• Aucun remboursement après le départ')
         .moveDown(1);
      
      doc.fontSize(10)
         .text('Contact: +235 XX XX XX XX', { align: 'center' })
         .text('Email: info@chadbusticketing.com', { align: 'center' });
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        logger.info('PDF ticket generated:', outputPath);
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        logger.error('PDF generation error:', error);
        reject(error);
      });
    } catch (error) {
      logger.error('Failed to generate PDF ticket:', error);
      reject(error);
    }
  });
};

/**
 * Generate text ticket for WhatsApp/SMS
 * @param {object} bookingData - Booking details
 * @returns {string} Formatted text ticket
 */
const generateTextTicket = (bookingData) => {
  const passengers = bookingData.passengers
    .map((p, i) => `${i + 1}. ${p.fullName} - Place ${p.seatNumber}`)
    .join('\n');
  
  let ticket = `
🎫 *BILLET DE VOYAGE - CHAD BUS*

📋 *Code:* ${bookingData.bookingCode}

🚌 *TRAJET*
De: ${bookingData.route.originCity}
À: ${bookingData.route.destinationCity}
Date: ${bookingData.departureDate}
Heure: ${bookingData.departureTime}
${bookingData.boardingPoint ? `Point d'embarquement: ${bookingData.boardingPoint}` : ''}

👥 *PASSAGERS*
${passengers}

🚍 *BUS*
Numéro: ${bookingData.bus.busNumber}
${bookingData.bus.plateNumber ? `Plaque: ${bookingData.bus.plateNumber}` : ''}
  `.trim();
  
  if (bookingData.luggage) {
    ticket += `\n\n📦 *BAGAGES*
Nombre: ${bookingData.luggage.numberOfBags}
Poids: ${bookingData.luggage.estimatedWeight} kg`;
    
    if (bookingData.luggage.totalExtraFee > 0) {
      ticket += `\nFrais extra: ${bookingData.luggage.totalExtraFee} FCFA`;
    }
  }
  
  ticket += `\n\n💰 *PAIEMENT*
Total: ${bookingData.totalPrice} FCFA
Statut: ${bookingData.paymentStatus === 'PAID' ? 'Payé ✅' : 'En attente ⏳'}

⚠️ *IMPORTANT*
• Arrivez 30 min avant le départ
• Pièce d'identité requise
• Pas de remboursement après départ

Contact: +235 XX XX XX XX
  `.trim();
  
  return ticket;
};

/**
 * Ensure uploads directory exists
 */
const ensureUploadsDir = () => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const ticketsDir = path.join(uploadDir, 'tickets');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(ticketsDir)) {
    fs.mkdirSync(ticketsDir, { recursive: true });
  }
  
  return ticketsDir;
};

module.exports = {
  generatePDFTicket,
  generateTextTicket,
  ensureUploadsDir,
};
