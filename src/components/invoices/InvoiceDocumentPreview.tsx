import React from 'react';
import { HiOutlinePrinter, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { jsPDF } from 'jspdf';

export interface InvoicePreviewData {
  documentType: 'Invoice' | 'Voucher' | 'Receipt';
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: 'Pending' | 'Completed' | 'Partial' | 'Overdue';
  clientName: string;
  companyName: string;
  gstNumber?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  state?: string;
  pincode?: string;
  shippingAddressSameAsBilling?: boolean;
  shippingAddress?: string;
  shippingState?: string;
  shippingPincode?: string;
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    rate: number;
    taxRate: number;
    amount: number;
  }>;
  taxCalculationMode: 'CGST_SGST' | 'IGST' | 'Exempt';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applyRoundOff: boolean;
  paymentMethod: string;
  notes?: string;
  terms?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOffTotal: number;
  grandTotal: number;
  amountPaid: number;
}

// Number to Words Converter Utility for Indian Rupees
function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = Math.floor(num)) === 0) return 'Zero';
  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }
  return inWords(num).trim() + ' Rupees Only';
}

export const generateAndDownloadInvoicePDF = (data: InvoicePreviewData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const startX = 40;
  let startY = 50;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(47, 55, 214); // #2f37d6
  doc.setFont('helvetica', 'bold');
  doc.text('UNAI INFRA CIVIL RENTALS', startX, startY);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Heavy Civil Equipment, Plant Machinery & Infrastructure Solutions', startX, startY + 16);
  doc.text('GSTIN: 27AABCN8877K1Z4 | Email: accounts@unaiinfra.com | Phone: +91 98200 12345', startX, startY + 30);

  // Document Title Box
  startY += 65;
  doc.setFillColor(248, 250, 252);
  doc.rect(startX, startY, 515, 45, 'F');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(data.documentType.toUpperCase(), startX + 15, startY + 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Number: ${data.invoiceNumber}`, startX + 15, startY + 36);
  doc.text(`Date: ${data.invoiceDate}`, startX + 220, startY + 36);
  doc.text(`Due Date: ${data.dueDate}`, startX + 370, startY + 36);

  // Bill To Section
  startY += 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('INVOICE TO:', startX, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.clientName || 'Customer Name', startX, startY + 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (data.companyName) doc.text(data.companyName, startX, startY + 28);
  if (data.gstNumber) doc.text(`GSTIN: ${data.gstNumber}`, startX, startY + 41);
  if (data.billingAddress) doc.text(`Address: ${data.billingAddress}, ${data.state || ''} ${data.pincode || ''}`, startX, startY + 54);
  if (data.phone || data.email) doc.text(`Contact: ${data.phone || ''} ${data.email ? '• ' + data.email : ''}`, startX, startY + 67);

  // Table Header
  startY += 85;
  doc.setFillColor(47, 55, 214);
  doc.rect(startX, startY, 515, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('#', startX + 8, startY + 14);
  doc.text('ITEM / DESCRIPTION', startX + 30, startY + 14);
  doc.text('QTY', startX + 260, startY + 14);
  doc.text('RATE (INR)', startX + 310, startY + 14);
  doc.text('TAX %', startX + 390, startY + 14);
  doc.text('TOTAL (INR)', startX + 450, startY + 14);

  // Items
  startY += 22;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item, index) => {
    const lineY = startY + index * 20;
    doc.text((index + 1).toString().padStart(2, '0'), startX + 8, lineY + 14);
    doc.text(item.name || 'Item Name', startX + 30, lineY + 14);
    doc.text(item.quantity.toString(), startX + 260, lineY + 14);
    doc.text(`₹${item.rate.toLocaleString('en-IN')}`, startX + 310, lineY + 14);
    doc.text(`${item.taxRate}%`, startX + 390, lineY + 14);
    doc.text(`₹${(item.quantity * item.rate).toLocaleString('en-IN')}`, startX + 450, lineY + 14);
  });

  startY += Math.max(data.items.length * 20, 30) + 15;
  doc.line(startX, startY, startX + 515, startY);

  // Summary
  startY += 15;
  const summaryX = startX + 300;
  doc.setFontSize(9);
  doc.text('Subtotal:', summaryX, startY);
  doc.text(`₹${data.subtotal.toLocaleString('en-IN')}`, startX + 450, startY);

  if (data.discountTotal > 0) {
    startY += 16;
    doc.text('Discount:', summaryX, startY);
    doc.text(`-₹${data.discountTotal.toLocaleString('en-IN')}`, startX + 450, startY);
  }

  if (data.taxCalculationMode === 'CGST_SGST') {
    startY += 16;
    doc.text('CGST (9%):', summaryX, startY);
    doc.text(`₹${data.cgstTotal.toLocaleString('en-IN')}`, startX + 450, startY);
    startY += 16;
    doc.text('SGST (9%):', summaryX, startY);
    doc.text(`₹${data.sgstTotal.toLocaleString('en-IN')}`, startX + 450, startY);
  } else if (data.taxCalculationMode === 'IGST') {
    startY += 16;
    doc.text('IGST (18%):', summaryX, startY);
    doc.text(`₹${data.igstTotal.toLocaleString('en-IN')}`, startX + 450, startY);
  }

  startY += 20;
  doc.setFillColor(241, 245, 249);
  doc.rect(summaryX - 10, startY - 12, 225, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(47, 55, 214);
  doc.text('Grand Total:', summaryX, startY + 5);
  doc.text(`₹${data.grandTotal.toLocaleString('en-IN')}`, startX + 440, startY + 5);

  // Bottom info
  startY += 40;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Amount in Words: ${numberToWords(data.grandTotal)}`, startX, startY);
  doc.text(`Payment Mode: ${data.paymentMethod}`, startX, startY + 14);
  if (data.terms) doc.text(`Terms: ${data.terms}`, startX, startY + 28);

  doc.save(`${data.documentType}_${data.invoiceNumber || 'Document'}.pdf`);
};

export const InvoiceDocumentPreview: React.FC<{
  data: InvoicePreviewData;
  onClose?: () => void;
  showActions?: boolean;
}> = ({ data, showActions = true }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateAndDownloadInvoicePDF(data);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-md text-stone-800 text-left overflow-hidden">
      {/* Action Bar */}
      {showActions && (
        <div className="flex items-center justify-between p-3.5 bg-stone-50 border-b border-stone-200 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Document Live Preview</span>
            <Badge variant={data.status === 'Completed' ? 'success' : data.status === 'Pending' ? 'warning' : data.status === 'Overdue' ? 'danger' : 'brand'}>
              {data.status === 'Completed' ? 'Paid / Completed' : data.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<HiOutlinePrinter />}>
              Print
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownloadPDF} leftIcon={<HiOutlineArrowDownTray />}>
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Printable Sheet View */}
      <div className="p-6 md:p-8 space-y-6 text-xs max-h-[80vh] overflow-y-auto" id="invoice-sheet">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                U
              </div>
              <div>
                <h2 className="text-base font-extrabold text-brand-text tracking-tight uppercase m-0 leading-none">
                  UNAI INFRA
                </h2>
                <span className="text-[10px] text-primary font-bold tracking-wider uppercase">CIVIL RENTALS</span>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 font-medium leading-relaxed max-w-sm">
              Plot 42, UNAI Infra Commercial Hub, Depot Yard 3, Andheri East, Mumbai, Maharashtra 400069
            </p>
            <p className="text-[10px] font-mono text-stone-500 mt-1">
              GSTIN: <span className="font-bold text-stone-800">27AABCN8877K1Z4</span> • PAN: <span className="font-bold text-stone-800">AABCN8877K</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-blue-50 text-primary border border-blue-200 rounded-lg text-xs font-black tracking-widest uppercase">
              {data.documentType || 'TAX INVOICE'}
            </span>
            <div className="mt-2 space-y-0.5">
              <p className="text-xs font-mono font-bold text-brand-text">
                {data.invoiceNumber || 'INV-1030'}
              </p>
              <p className="text-[11px] text-stone-500">
                Date: <span className="font-semibold text-stone-700">{data.invoiceDate || 'N/A'}</span>
              </p>
              <p className="text-[11px] text-stone-500">
                Due: <span className="font-semibold text-stone-700">{data.dueDate || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">INVOICE TO</span>
            <h4 className="text-sm font-extrabold text-stone-900 mt-1">{data.clientName || 'Customer / Corporate Client'}</h4>
            {data.companyName && <p className="text-xs font-semibold text-primary">{data.companyName}</p>}
            {data.gstNumber && <p className="text-[11px] font-mono text-stone-600 mt-1">GSTIN: {data.gstNumber}</p>}
            {data.billingAddress && (
              <p className="text-[11px] text-stone-500 mt-1">
                {data.billingAddress}, {data.state || ''} {data.pincode || ''}
              </p>
            )}
            <div className="mt-1 text-[11px] text-stone-500 space-x-2">
              {data.phone && <span>Ph: {data.phone}</span>}
              {data.email && <span>• {data.email}</span>}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">PAYMENT INSTRUCTIONS</span>
            <div className="mt-1 space-y-0.5 text-[11px] text-stone-600">
              <p><span className="font-semibold text-stone-800">Mode:</span> {data.paymentMethod || 'Bank Transfer'}</p>
              <p><span className="font-semibold text-stone-800">Bank:</span> Bank Of Baroda (Corporate Branch)</p>
              <p><span className="font-semibold text-stone-800">A/C No:</span> 06430200001234 (Current)</p>
              <p><span className="font-semibold text-stone-800">IFSC:</span> BARB0ANDHER</p>
              <p><span className="font-semibold text-stone-800">UPI ID:</span> unaiinfra@okhdfcbank</p>
            </div>
          </div>
        </div>

        {/* Product / Items Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-3.5 py-2.5 w-12 text-center">NO.</th>
                <th className="px-3.5 py-2.5">PRODUCT / PARTICULARS</th>
                <th className="px-3.5 py-2.5 text-center">QTY</th>
                <th className="px-3.5 py-2.5 text-right">RATE</th>
                <th className="px-3.5 py-2.5 text-center">TAX</th>
                <th className="px-3.5 py-2.5 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-stone-50/50">
                  <td className="px-3.5 py-2.5 text-center font-mono text-stone-400 font-bold">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <p className="font-bold text-stone-800">{item.name || 'Item Name'}</p>
                    {item.description && (
                      <p className="text-[10px] text-stone-400 font-medium">{item.description}</p>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-semibold text-stone-700">
                    {item.quantity}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-stone-700">
                    ₹{item.rate.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3.5 py-2.5 text-center text-[10px] font-bold text-stone-500">
                    {item.taxRate}%
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-stone-900">
                    ₹{(item.quantity * item.rate).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Grid */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          {/* Notes & Words */}
          <div className="flex-1 space-y-3">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">AMOUNT IN WORDS</span>
              <p className="text-xs font-bold text-stone-800 italic mt-0.5">
                {numberToWords(data.grandTotal)}
              </p>
            </div>

            {data.notes && (
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">DOCUMENT NOTES</span>
                <p className="text-xs text-stone-600 mt-0.5 font-medium">{data.notes}</p>
              </div>
            )}

            {data.terms && (
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">TERMS & CONDITIONS</span>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{data.terms}</p>
              </div>
            )}
          </div>

          {/* Calculations Box */}
          <div className="w-full sm:w-64 bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Item Subtotal:</span>
              <span className="font-semibold text-stone-800">₹{data.subtotal.toLocaleString('en-IN')}</span>
            </div>

            {data.discountTotal > 0 && (
              <div className="flex justify-between text-xs text-green-700">
                <span>Discount:</span>
                <span className="font-bold">-₹{data.discountTotal.toLocaleString('en-IN')}</span>
              </div>
            )}

            {data.taxCalculationMode === 'CGST_SGST' ? (
              <>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>CGST (9%):</span>
                  <span className="font-medium text-stone-800">₹{data.cgstTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>SGST (9%):</span>
                  <span className="font-medium text-stone-800">₹{data.sgstTotal.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : data.taxCalculationMode === 'IGST' ? (
              <div className="flex justify-between text-xs text-stone-600">
                <span>IGST (18%):</span>
                <span className="font-medium text-stone-800">₹{data.igstTotal.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="flex justify-between text-xs text-stone-500">
                <span>Tax Mode:</span>
                <span>Exempt (0%)</span>
              </div>
            )}

            {data.applyRoundOff && data.roundOffTotal !== 0 && (
              <div className="flex justify-between text-xs text-stone-500">
                <span>Round Off:</span>
                <span>{data.roundOffTotal > 0 ? `+₹${data.roundOffTotal.toFixed(2)}` : `-₹${Math.abs(data.roundOffTotal).toFixed(2)}`}</span>
              </div>
            )}

            <div className="border-t border-blue-200/70 pt-2 flex justify-between items-baseline">
              <span className="text-xs font-bold text-stone-900 uppercase">Grand Total:</span>
              <span className="text-base font-extrabold text-primary">₹{data.grandTotal.toLocaleString('en-IN')}</span>
            </div>

            {data.amountPaid > 0 && (
              <div className="pt-2 border-t border-blue-200/40 space-y-1">
                <div className="flex justify-between text-xs font-bold text-green-700">
                  <span>Paid Amount:</span>
                  <span>₹{data.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-red-600">
                  <span>Balance Due:</span>
                  <span>₹{(data.grandTotal - data.amountPaid).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-6 border-t border-stone-200 flex justify-between items-end">
          <div className="text-[10px] text-stone-400">
            <p>This is a computer generated invoice and requires no physical seal.</p>
            <p className="mt-0.5">UNAI Infra Civil Operations • ISO 9001:2015 Certified</p>
          </div>

          <div className="text-right">
            <div className="h-12 flex items-center justify-end">
              <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-[11px] font-mono font-bold text-primary">
                UNAI INFRA AUTH. SIGNATURE
              </div>
            </div>
            <p className="text-xs font-bold text-stone-800 mt-1">Authorized Signatory</p>
            <p className="text-[10px] text-stone-400">Accounts & Billing Operations</p>
          </div>
        </div>
      </div>
    </div>
  );
};
