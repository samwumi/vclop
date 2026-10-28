import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(transactionId: string): Promise<{ buffer: Buffer; filename: string }> {
    const transaction = await this.prisma.repaymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        loan: {
          include: {
            loanApplication: {
              include: { customer: true, loanProduct: true },
            },
            installments: { orderBy: { installmentNumber: 'asc' } },
          },
        },
      },
    });
    if (!transaction) throw new ResourceNotFoundException('Repayment transaction', transactionId);

    const { loan } = transaction;
    const customer = loan.loanApplication.customer;
    const product = loan.loanApplication.loanProduct;

    // Use actual person name, fallback to business name only if firstName/lastName are empty
    const customerDisplayName = customer.firstName && customer.lastName 
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : customer.businessName || 'N/A';

    const outstandingBalance = loan.installments.reduce(
      (sum, inst) => sum + (Number(inst.totalDue) - Number(inst.amountPaid)),
      0,
    );

    const buffer = await this.renderPdf({
      receiptNumber: transaction.receiptNumber ?? `RCT-${transaction.id.slice(0, 8).toUpperCase()}`,
      issuedAt: transaction.createdAt,
      customerName: customerDisplayName,
      customerNumber: customer.customerNumber,
      loanNumber: loan.loanNumber,
      productName: product.name,
      amount: Number(transaction.amount),
      method: transaction.method,
      reference: transaction.reference,
      loanStatus: loan.status,
      outstandingBalance,
    });

    return { buffer, filename: `receipt-${transaction.receiptNumber ?? transaction.id}.pdf` };
  }

  private renderPdf(data: {
    receiptNumber: string;
    issuedAt: Date;
    customerName: string;
    customerNumber: string;
    loanNumber: string;
    productName: string;
    amount: number;
    method: string;
    reference: string | null;
    loanStatus: string;
    outstandingBalance: number;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──────────────────────────────────────────────────────────
      doc.fontSize(18).font('Helvetica-Bold').text('Vertical Capital', { align: 'left' });
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text('Loan Repayment Receipt', { align: 'left' });
      doc.moveDown(1.5);

      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(`Receipt No: ${data.receiptNumber}`);
      doc.font('Helvetica').fontSize(10).fillColor('#444444').text(`Issued: ${data.issuedAt.toDateString()} ${data.issuedAt.toTimeString().slice(0, 8)}`);
      doc.moveDown(1.5);

      // ── Customer & Loan details ─────────────────────────────────────────
      this.drawRow(doc, 'Customer', `${data.customerName} (${data.customerNumber})`);
      this.drawRow(doc, 'Loan Number', data.loanNumber);
      this.drawRow(doc, 'Loan Product', data.productName);
      doc.moveDown(1);

      // ── Payment details box ─────────────────────────────────────────────
      const boxTop = doc.y;
      doc.rect(50, boxTop, 495, 100).fillAndStroke('#F9FAFB', '#E5E7EB');
      doc.fillColor('#000000');

      doc.font('Helvetica-Bold').fontSize(11).text('Payment Details', 65, boxTop + 12);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Amount Paid:`, 65, boxTop + 34);
      doc.font('Helvetica-Bold').text(`NGN ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 200, boxTop + 34);
      doc.font('Helvetica').text(`Method:`, 65, boxTop + 52);
      doc.text(data.method, 200, boxTop + 52);
      doc.text(`Reference:`, 65, boxTop + 70);
      doc.text(data.reference ?? '—', 200, boxTop + 70);

      doc.y = boxTop + 115;

      // ── Loan status after this payment ──────────────────────────────────
      doc.moveDown(1);
      this.drawRow(doc, 'Loan Status', data.loanStatus);
      this.drawRow(
        doc,
        'Outstanding Balance',
        data.outstandingBalance <= 0.01 ? 'Fully Repaid' : `NGN ${data.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      );

      doc.moveDown(3);
      doc.fontSize(8).fillColor('#999999').text(
        'This receipt was generated automatically by VCLOP. Keep it for your records.',
        { align: 'center' },
      );

      doc.end();
    });
  }

  private drawRow(doc: PDFKit.PDFDocument, label: string, value: string): void {
    doc.font('Helvetica').fontSize(10).fillColor('#666666').text(label, { continued: true, width: 495 });
    doc.font('Helvetica-Bold').fillColor('#000000').text(`   ${value}`);
  }

  async generateImage(transactionId: string): Promise<{ buffer: Buffer; filename: string }> {
    const transaction = await this.prisma.repaymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        loan: {
          include: {
            loanApplication: {
              include: { customer: true, loanProduct: true },
            },
            installments: { orderBy: { installmentNumber: 'asc' } },
          },
        },
      },
    });
    if (!transaction) throw new ResourceNotFoundException('Repayment transaction', transactionId);

    const { loan } = transaction;
    const customer = loan.loanApplication.customer;
    const product = loan.loanApplication.loanProduct;

    // Use actual person name, fallback to business name only if firstName/lastName are empty
    const customerDisplayName = customer.firstName && customer.lastName 
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : customer.businessName || 'N/A';

    const outstandingBalance = loan.installments.reduce(
      (sum, inst) => sum + (Number(inst.totalDue) - Number(inst.amountPaid)),
      0,
    );

    const buffer = await this.renderImage({
      receiptNumber: transaction.receiptNumber ?? `RCT-${transaction.id.slice(0, 8).toUpperCase()}`,
      issuedAt: transaction.createdAt,
      customerName: customerDisplayName,
      customerNumber: customer.customerNumber,
      loanNumber: loan.loanNumber,
      productName: product.name,
      amount: Number(transaction.amount),
      method: transaction.method,
      reference: transaction.reference,
      loanStatus: loan.status,
      outstandingBalance,
    });

    return { buffer, filename: `receipt-${transaction.receiptNumber ?? transaction.id}.png` };
  }

  private async renderImage(data: {
    receiptNumber: string;
    issuedAt: Date;
    customerName: string;
    customerNumber: string;
    loanNumber: string;
    productName: string;
    amount: number;
    method: string;
    reference: string | null;
    loanStatus: string;
    outstandingBalance: number;
  }): Promise<Buffer> {
    // Create canvas (OPay-style receipt dimensions)
    const width = 600;
    const height = 900;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Header with brand color
    ctx.fillStyle = '#10B981'; // Green brand color
    ctx.fillRect(0, 0, width, 120);

    // Company name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Vertical Capital', width / 2, 50);

    // Receipt title
    ctx.font = '18px Arial';
    ctx.fillText('Payment Receipt', width / 2, 85);

    // Success checkmark circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(width / 2, 160, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('✓', width / 2, 180);

    // Amount section
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, width / 2, 250);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('Payment Successful', width / 2, 280);

    // Details box
    const boxY = 320;
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(30, boxY, width - 60, 400);

    // Receipt details
    ctx.textAlign = 'left';
    let y = boxY + 40;
    const leftX = 60;
    const rightX = width - 60;

    const details = [
      ['Receipt No', data.receiptNumber],
      ['Date & Time', data.issuedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })],
      ['Customer', `${data.customerName}\n${data.customerNumber}`],
      ['Loan Number', data.loanNumber],
      ['Product', data.productName],
      ['Payment Method', data.method],
      ['Reference', data.reference || '—'],
      ['Loan Status', data.loanStatus],
      ['Outstanding', data.outstandingBalance <= 0.01 ? 'Fully Repaid' : `₦${data.outstandingBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`],
    ];

    details.forEach(([label, value]) => {
      // Label
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(label, leftX, y);
      
      // Value
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1F2937';
      
      // Handle multiline values (e.g., customer name + number)
      const lines = value.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, rightX - 300, y + (i * 22));
      });
      
      y += 40 + (lines.length - 1) * 22;
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('Keep this receipt for your records', width / 2, height - 60);
    ctx.fillText('Powered by VCLOP', width / 2, height - 35);

    return canvas.toBuffer('image/png');
  }
}
