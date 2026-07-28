import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
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

    const outstandingBalance = loan.installments.reduce(
      (sum, inst) => sum + (Number(inst.totalDue) - Number(inst.amountPaid)),
      0,
    );

    const buffer = await this.renderPdf({
      receiptNumber: transaction.receiptNumber ?? `RCT-${transaction.id.slice(0, 8).toUpperCase()}`,
      issuedAt: transaction.createdAt,
      customerName: customer.businessName ?? `${customer.firstName} ${customer.lastName}`,
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
}
