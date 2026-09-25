import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { RentalRequest, AdditionalCharges } from '../../types';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  HiOutlineEye,
  HiOutlineDocumentArrowDown,
  HiOutlinePrinter,
  HiOutlineEnvelope,
  HiOutlinePaperAirplane
} from 'react-icons/hi2';

export const RentalRequests: React.FC = () => {
  const { rentalRequests, approveRentalRequest, rejectRentalRequest, logActivity, settings } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  
  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Form adjustment states
  const [transCharge, setTransCharge] = useState(0);
  const [loadCharge, setLoadCharge] = useState(0);
  const [unloadCharge, setUnloadCharge] = useState(0);
  const [delivCharge, setDelivCharge] = useState(0);
  const [dmgCharge, setDmgCharge] = useState(0);
  const [lateCharge, setLateCharge] = useState(0);
  const [discountVal, setDiscountVal] = useState(0);
  const [gstRate, setGstRate] = useState(18);

  const invoiceRef = useRef<HTMLDivElement>(null);

  const filteredRequests = rentalRequests.filter(r => r.status === activeTab);

  const handleOpenReview = (req: RentalRequest) => {
    setSelectedRequest(req);
    setTransCharge(req.additionalCharges.transportation);
    setLoadCharge(req.additionalCharges.loading);
    setUnloadCharge(req.additionalCharges.unloading);
    setDelivCharge(req.additionalCharges.delivery);
    setDmgCharge(req.additionalCharges.damage);
    setLateCharge(req.additionalCharges.lateFee);
    setDiscountVal(req.discountTotal);
    setIsReviewModalOpen(true);
  };

  const calculateReviewTotals = () => {
    if (!selectedRequest) return { subtotal: 0, addTotal: 0, discount: 0, gst: 0, grandTotal: 0 };

    const subtotal = selectedRequest.items.reduce((sum, i) => sum + i.subtotal, 0);
    const addTotal = transCharge + loadCharge + unloadCharge + delivCharge + dmgCharge + lateCharge;
    const discount = discountVal;
    const taxable = Math.max(0, subtotal - discount);
    const gst = Math.round(taxable * (gstRate / 100));
    const grandTotal = taxable + gst + addTotal;

    return { subtotal, addTotal, discount, gst, grandTotal };
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    const { discount, gst, grandTotal } = calculateReviewTotals();

    const additionalCharges: AdditionalCharges = {
      transportation: transCharge,
      loading: loadCharge,
      unloading: unloadCharge,
      delivery: delivCharge,
      damage: dmgCharge,
      lateFee: lateCharge
    };

    approveRentalRequest(
      selectedRequest.id,
      additionalCharges,
      discount,
      gst,
      grandTotal
    );

    logActivity(
      user?.name || 'Admin',
      'admin',
      'Approved Rental Request',
      'rental',
      `Approved rental request for ${selectedRequest.clientName} and generated invoice.`
    );

    toast.success('Rental request approved. Invoice & Rental agreements generated.');
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const handleReject = (id: string) => {
    rejectRentalRequest(id);
    logActivity(
      user?.name || 'Admin',
      'admin',
      'Rejected Rental Request',
      'rental',
      `Rejected request ID ${id}`
    );
    toast.error('Rental request has been rejected');
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const handleOpenInvoice = (req: RentalRequest) => {
    setSelectedRequest(req);
    setIsInvoiceModalOpen(true);
  };

  // PDF Export
  const downloadInvoicePDF = async () => {
    if (!invoiceRef.current || !selectedRequest) return;
    toast.info('Generating PDF document...');
    
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 297; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice_${selectedRequest.invoiceNumber || 'INV-TEMP'}.pdf`);
      toast.success('Invoice PDF downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF invoice');
      console.error(err);
    }
  };

  // Standard window print
  const printInvoice = () => {
    window.print();
  };

  // Email invoice simulation
  const emailInvoice = () => {
    if (!selectedRequest) return;
    toast.success(`Invoice emailed successfully to ${selectedRequest.clientName} (${selectedRequest.invoiceNumber}@unaiinfra.in)`);
  };

  const getStatusBadge = (status: RentalRequest['status']) => {
    switch (status) {
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Pending': return <Badge variant="warning">Pending Approval</Badge>;
      case 'Rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Rental Approval Portal</h1>
        <p className="text-xs text-brand-dark-grey mt-0.5">Review, add charges, approve requests, and generate client tax invoices.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border">
        {(['Pending', 'Approved', 'Rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-xs font-bold border-b-2 transition-all duration-150 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-brand-dark-grey hover:text-brand-text'
            }`}
          >
            {tab} Requests ({rentalRequests.filter(r => r.status === tab).length})
          </button>
        ))}
      </div>

      {/* Request Table Grid */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {filteredRequests.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Request Ref</th>
                  <th className="px-6 py-4">Client Representative</th>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Rental Dates</th>
                  <th className="px-6 py-4">Grand Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-brand-light-grey/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-brand-text">
                      {req.rentalNumber || `REQ-${req.id.substring(4, 8).toUpperCase()}`}
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-text">{req.clientName}</td>
                    <td className="px-6 py-4 text-brand-dark-grey font-medium">{req.companyName}</td>
                    <td className="px-6 py-4 text-brand-dark-grey font-medium">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">₹{req.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 mt-1.5">
                      {req.status === 'Pending' ? (
                        <Button variant="primary" size="sm" onClick={() => handleOpenReview(req)}>
                          Review & Approve
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleOpenInvoice(req)} leftIcon={<HiOutlineEye />}>
                          View Invoice
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No Requests" description={`There are no ${activeTab.toLowerCase()} requests currently registered in the database.`} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Review & Approve Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Audit & Adjust Rental Request" size="xl">
        {selectedRequest && (
          <div className="space-y-6 text-left text-xs">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-brand-light-grey p-4 border border-brand-border rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Client Company</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedRequest.companyName}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Rental Schedule</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedRequest.startDate} to {selectedRequest.endDate}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey">Duration</span>
                <p className="font-bold text-brand-text mt-0.5">{selectedRequest.items[0]?.durationDays} Days</p>
              </div>
            </div>

            {/* Equipment list breakdown */}
            <div>
              <h4 className="font-bold text-[10px] uppercase text-brand-dark-grey tracking-wider mb-2">Requested Equipment</h4>
              <table className="w-full text-left border border-brand-border text-xs rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-brand-light-grey font-bold border-b border-brand-border text-brand-dark-grey">
                    <th className="px-4 py-2">Item Name</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Rate/Day</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-brand-border/40">
                      <td className="px-4 py-2.5 font-semibold text-brand-text">{item.equipmentName}</td>
                      <td className="px-4 py-2.5">{item.quantity}</td>
                      <td className="px-4 py-2.5">₹{item.dailyCharges.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-bold">₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Adjustment Form Grid */}
            <div>
              <h4 className="font-bold text-[10px] uppercase text-brand-dark-grey tracking-wider mb-3">Auxiliary Adjustments & Additions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Input label="Transportation Fee (₹)" type="number" value={transCharge || ''} onChange={e => setTransCharge(Number(e.target.value))} />
                <Input label="Loading Fee (₹)" type="number" value={loadCharge || ''} onChange={e => setLoadCharge(Number(e.target.value))} />
                <Input label="Unloading Fee (₹)" type="number" value={unloadCharge || ''} onChange={e => setUnloadCharge(Number(e.target.value))} />
                <Input label="Delivery Fee (₹)" type="number" value={delivCharge || ''} onChange={e => setDelivCharge(Number(e.target.value))} />
                <Input label="Damage Penalty (₹)" type="number" value={dmgCharge || ''} onChange={e => setDmgCharge(Number(e.target.value))} />
                <Input label="Late Return Fee (₹)" type="number" value={lateCharge || ''} onChange={e => setLateCharge(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Direct Applied Discount (₹)" type="number" value={discountVal || ''} onChange={e => setDiscountVal(Number(e.target.value))} />
              <Input label="GST Tax Rate (%)" type="number" value={gstRate || ''} onChange={e => setGstRate(Number(e.target.value))} />
            </div>

            {/* Calculations Summary Card */}
            {(() => {
              const { subtotal, addTotal, discount, gst, grandTotal } = calculateReviewTotals();
              return (
                <div className="bg-brand-light-grey rounded-xl border border-brand-border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-brand-dark-grey font-medium">Rental Charges Subtotal:</span>
                    <span className="font-bold text-brand-text">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-dark-grey font-medium">Applied Discounts:</span>
                    <span className="font-bold text-red-600">- ₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-dark-grey font-medium">GST Tax ({gstRate}%):</span>
                    <span className="font-bold text-brand-text">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-dark-grey font-medium">Auxiliary Adjustments Total:</span>
                    <span className="font-bold text-brand-text">₹{addTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-[1px] bg-brand-border" />
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="font-bold text-brand-text text-sm">Approved Grand Total:</span>
                    <span className="font-extrabold text-primary text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between gap-4 pt-4 border-t border-brand-border">
              <Button variant="danger" size="sm" type="button" onClick={() => handleReject(selectedRequest.id)}>
                Reject Request
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsReviewModalOpen(false)}>
                  Cancel Review
                </Button>
                <Button variant="primary" size="sm" type="button" onClick={handleApprove}>
                  Approve & Issue Invoice
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Client Tax Invoice Viewer" size="xl">
        {selectedRequest && (
          <div className="space-y-6">
            {/* Quick Actions Panel */}
            <div className="flex justify-between bg-brand-light-grey p-3 border border-brand-border rounded-xl">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadInvoicePDF} leftIcon={<HiOutlineDocumentArrowDown />}>
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" onClick={printInvoice} leftIcon={<HiOutlinePrinter />}>
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={emailInvoice} leftIcon={<HiOutlineEnvelope />}>
                  Email Invoice
                </Button>
              </div>
              <Badge variant={selectedRequest.paymentStatus === 'Completed' ? 'success' : selectedRequest.paymentStatus === 'Overdue' ? 'danger' : 'warning'}>
                Payment Status: {selectedRequest.paymentStatus}
              </Badge>
            </div>

            {/* Renderable Invoice Sheet */}
            <div
              ref={invoiceRef}
              id="unai-invoice-document"
              className="bg-white border border-brand-border rounded-xl p-8 sm:p-12 text-left text-xs max-w-3xl mx-auto shadow-sm"
              style={{ color: '#111827' }}
            >
              {/* Header: Company Details & Invoice Metadata */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-brand-border pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-base">UI</div>
                    <span className="font-extrabold text-sm tracking-wider">UNAI INFRA Ltd</span>
                  </div>
                  <p className="text-[10px] text-brand-dark-grey leading-relaxed">
                    Plot No. 124, Phase 2, Panvel Industrial Area,<br />
                    Navi Mumbai, Maharashtra - 410206<br />
                    GSTIN: <strong className="font-mono">{settings.gstNumber}</strong><br />
                    Email: billing@unaiinfra.in | Phone: +91 22 2748 9988
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-lg font-extrabold text-primary uppercase tracking-wider mb-2">Tax Invoice</h2>
                  <div className="space-y-1 text-[10px] text-brand-dark-grey">
                    <p>Invoice Number: <strong className="text-brand-text font-mono">{selectedRequest.invoiceNumber || 'INV-Pending'}</strong></p>
                    <p>Rental Number: <strong className="text-brand-text font-mono">{selectedRequest.rentalNumber || 'REN-Pending'}</strong></p>
                    <p>Invoice Date: <strong className="text-brand-text">{selectedRequest.invoiceDate || selectedRequest.createdAt.split('T')[0]}</strong></p>
                    <p>Expected Return: <strong className="text-brand-text">{selectedRequest.expectedReturnDate}</strong></p>
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-dark-grey block mb-1">Bill To Client:</span>
                  <p className="font-bold text-brand-text text-sm">{selectedRequest.companyName}</p>
                  <p className="text-[10px] text-brand-dark-grey leading-relaxed mt-1">
                    Attention: {selectedRequest.clientName}<br />
                    Client GSTIN: <strong className="font-mono">{selectedRequest.clientId ? '27AADCL9876R1ZV' : 'N/A'}</strong><br />
                    Billing Address details as registered in account.
                  </p>
                </div>
              </div>

              {/* Equipment Items Table */}
              <table className="w-full text-left border-collapse text-xs border border-brand-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-brand-light-grey font-bold border-b border-brand-border text-brand-dark-grey">
                    <th className="px-4 py-2.5">Item Specifications</th>
                    <th className="px-4 py-2.5 text-center">Quantity</th>
                    <th className="px-4 py-2.5 text-center">Rental Days</th>
                    <th className="px-4 py-2.5 text-right">Daily Rate</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {selectedRequest.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-brand-text">{item.equipmentName}</p>
                        <p className="text-[10px] text-brand-dark-grey mt-0.5">Asset ID: {item.equipmentId}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-center font-medium">{item.durationDays} Days</td>
                      <td className="px-4 py-3 text-right font-medium">₹{item.dailyCharges.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-brand-text">₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total calculations grid */}
              <div className="py-6 flex flex-col sm:flex-row justify-between items-start gap-8">
                {/* Left side: payment details & signature */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-dark-grey block mb-1">Payment Options Scan QR:</span>
                    <div className="flex items-center gap-3 border border-brand-border p-2 rounded-lg bg-brand-light-grey">
                      <div className="p-1 bg-white border border-brand-border rounded">
                        <HiOutlinePaperAirplane className="h-10 w-10 text-primary rotate-45" />
                      </div>
                      <span className="text-[10px] text-brand-dark-grey font-semibold">Scan code via GooglePay, PhonePe, UPI to pay ₹{(selectedRequest.grandTotal - selectedRequest.amountPaid).toLocaleString('en-IN')} balance dues.</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-brand-dark-grey leading-relaxed">
                      Terms: Refundable deposit is released upon successful returned yard verification of equipment without mechanical damages.
                    </p>
                  </div>
                </div>

                {/* Right side: prices */}
                <div className="w-full sm:w-64 space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-brand-dark-grey">Subtotal:</span>
                    <span className="font-semibold text-brand-text">₹{selectedRequest.rentalChargesTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount Dues:</span>
                    <span>- ₹{selectedRequest.discountTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (CGST+SGST) 18%:</span>
                    <span>₹{selectedRequest.gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation Logistics:</span>
                    <span>₹{selectedRequest.additionalCharges.transportation.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Auxiliary Fees:</span>
                    <span>₹{(selectedRequest.additionalCharges.loading + selectedRequest.additionalCharges.unloading + selectedRequest.additionalCharges.delivery + selectedRequest.additionalCharges.damage + selectedRequest.additionalCharges.lateFee).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-[1px] bg-brand-border" />
                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span className="text-brand-text">Grand Total:</span>
                    <span className="text-primary font-extrabold text-sm">₹{selectedRequest.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Amount Paid:</span>
                    <span>₹{selectedRequest.amountPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs border-t border-brand-border pt-1">
                    <span className="text-brand-text">Balance Due:</span>
                    <span className="text-brand-text">₹{(selectedRequest.grandTotal - selectedRequest.amountPaid).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signature section */}
              <div className="border-t border-brand-border pt-8 mt-6 flex justify-between items-center text-[10px] text-brand-dark-grey">
                <div>
                  <p>Authorized Signature: _______________________</p>
                  <p className="mt-1">UNAI Infra Accounts Executive</p>
                </div>
                <div className="text-right">
                  <p>Receiver Signature: _______________________</p>
                  <p className="mt-1">Client representative acknowledge date</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-border">
              <Button variant="primary" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>Close Invoice</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default RentalRequests;
