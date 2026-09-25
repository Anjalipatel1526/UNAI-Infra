import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { RentalRequest } from '../../types';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCreditCard,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineChevronRight,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';
import { InvoiceDocumentPreview, type InvoicePreviewData } from '../../components/invoices/InvoiceDocumentPreview';

export const Payments: React.FC = () => {
  const { rentalRequests, recordPayment, deleteInvoice, logActivity } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalRequest | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<RentalRequest | null>(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<RentalRequest | null>(null);

  // Form states for Payment
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer'>('Bank Transfer');

  // Filter approved rentals and issued invoices
  const invoices = rentalRequests.filter(r => r.status === 'Approved');

  // Calculations
  const receivedAmount = invoices.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalInvoiced = invoices.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  const outstandingAmount = Math.max(0, totalInvoiced - receivedAmount);
  const overdueAmount = invoices
    .filter(r => r.paymentStatus === 'Overdue')
    .reduce((sum, r) => sum + (r.grandTotal - (r.amountPaid || 0)), 0);

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      (inv.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || inv.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleOpenRecord = (rental: RentalRequest) => {
    setSelectedRental(rental);
    setPayAmount(rental.grandTotal - rental.amountPaid);
    setPayMethod('Bank Transfer');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    if (payAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    const remainingBalance = selectedRental.grandTotal - selectedRental.amountPaid;
    if (payAmount > remainingBalance) {
      toast.error(`Payment amount cannot exceed the balance due of ₹${remainingBalance.toLocaleString('en-IN')}`);
      return;
    }

    recordPayment(selectedRental.id, payAmount, payMethod);
    logActivity(
      user?.name || 'Admin',
      'admin',
      'Recorded Payment',
      'payment',
      `Recorded payment of ₹${payAmount.toLocaleString('en-IN')} for Invoice ${selectedRental.invoiceNumber} via ${payMethod}`
    );

    toast.success(`Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully!`);
    setIsPaymentModalOpen(false);
    setSelectedRental(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmInvoice) return;
    try {
      await deleteInvoice(deleteConfirmInvoice.id);
      logActivity(
        user?.name || 'Admin',
        'admin',
        'Deleted Invoice',
        'delete',
        `Deleted commercial document ${deleteConfirmInvoice.invoiceNumber}`
      );
      toast.success(`Invoice ${deleteConfirmInvoice.invoiceNumber} removed successfully`);
      setDeleteConfirmInvoice(null);
    } catch (err: any) {
      toast.error('Failed to remove invoice');
    }
  };

  const getStatusBadge = (status: RentalRequest['paymentStatus']) => {
    switch (status) {
      case 'Completed': return <Badge variant="success">Completed</Badge>;
      case 'Partial': return <Badge variant="brand">Partial</Badge>;
      case 'Pending': return <Badge variant="warning">Pending</Badge>;
      case 'Overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Map RentalRequest to PreviewData for printable document
  const mapRentalToPreviewData = (inv: RentalRequest): InvoicePreviewData => {
    const subtotal = inv.rentalChargesTotal || inv.grandTotal;
    const cgst = Math.round((inv.gstTotal || 0) / 2);
    const sgst = Math.round((inv.gstTotal || 0) / 2);

    return {
      documentType: (inv.documentType as any) || 'Invoice',
      invoiceNumber: inv.invoiceNumber || 'INV-1030',
      invoiceDate: inv.invoiceDate || inv.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate || inv.expectedReturnDate || inv.endDate || 'N/A',
      status: inv.paymentStatus || 'Pending',
      clientName: inv.clientName,
      companyName: inv.companyName,
      gstNumber: inv.gstNumber || '',
      email: inv.email || '',
      phone: inv.phone || '',
      billingAddress: inv.billingAddress || '',
      state: inv.state || 'Maharashtra',
      pincode: inv.pincode || '',
      shippingAddressSameAsBilling: inv.shippingAddressSameAsBilling ?? true,
      shippingAddress: inv.shippingAddress,
      shippingState: inv.shippingState,
      shippingPincode: inv.shippingPincode,
      items: (inv.items && inv.items.length > 0)
        ? inv.items.map(item => ({
            id: item.equipmentId,
            name: item.equipmentName,
            description: item.notes,
            quantity: item.quantity,
            rate: item.dailyCharges,
            taxRate: item.taxes || 18,
            amount: item.subtotal || (item.quantity * item.dailyCharges)
          }))
        : [{
            id: 'item-1',
            name: 'Equipment Rental & Operations',
            description: 'Depot heavy machinery rental services',
            quantity: 1,
            rate: subtotal,
            taxRate: 18,
            amount: subtotal
          }],
      taxCalculationMode: inv.taxCalculationMode || 'CGST_SGST',
      discountType: inv.discountType || 'percentage',
      discountValue: inv.discountValue || 0,
      applyRoundOff: inv.applyRoundOff ?? true,
      paymentMethod: inv.paymentMethod || 'Bank Transfer',
      notes: inv.notes || 'Thank you for your business!',
      terms: inv.terms || 'Payment due within 15 days of invoice date.',
      subtotal,
      discountTotal: inv.discountTotal || 0,
      taxTotal: inv.gstTotal || 0,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: inv.gstTotal || 0,
      roundOffTotal: 0,
      grandTotal: inv.grandTotal,
      amountPaid: inv.amountPaid || 0
    };
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header: Title and Create Invoice Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Payments Ledger</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Track invoice collections, log incoming transactions, and manage overdue balances.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateInvoiceOpen(true)}
          leftIcon={<HiOutlinePlusCircle />}
          className="shrink-0"
        >
          Create Invoice
        </Button>
      </div>

      {/* Financial Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 shrink-0">
              <HiOutlineCurrencyRupee className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Total Received</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">₹{receivedAmount.toLocaleString('en-IN')}</h3>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-primary rounded-xl border border-blue-100 shrink-0">
              <HiOutlineCreditCard className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Total Outstanding</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">₹{outstandingAmount.toLocaleString('en-IN')}</h3>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
              <HiOutlineClock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Overdue Dues</span>
              <h3 className="text-lg font-extrabold text-red-600 mt-0.5">₹{overdueAmount.toLocaleString('en-IN')}</h3>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-brand-dark-grey rounded-xl border border-brand-border shrink-0">
              <HiOutlineCheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Invoices Issued</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">{invoices.length} Invoices</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter panel */}
      <Card>
        <CardBody className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-3 text-brand-dark-grey h-4 w-4" />
              <input
                type="text"
                placeholder="Search by client name, invoice number, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-xl text-xs transition-all focus:outline-none focus:border-primary bg-white"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-xl text-xs bg-white focus:outline-none focus:border-primary text-brand-text font-medium cursor-pointer"
              >
                <option value="All">All Payment States</option>
                <option value="Completed">Completed</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Invoices List Container */}
      <Card>
        <CardBody className="p-0">
          {filteredInvoices.length > 0 ? (
            <>
              {/* DESKTOP TABLE VIEW (hidden lg:block) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                      <th className="px-6 py-4">Invoice No</th>
                      <th className="px-6 py-4">Client Representative</th>
                      <th className="px-6 py-4">Total Billed</th>
                      <th className="px-6 py-4">Amount Paid</th>
                      <th className="px-6 py-4">Remaining Balance</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredInvoices.map(inv => {
                      const balance = inv.grandTotal - inv.amountPaid;
                      return (
                        <tr key={inv.id} className="hover:bg-brand-light-grey/30 transition-colors whitespace-nowrap">
                          <td className="px-6 py-4 font-bold text-brand-text font-mono">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-primary border border-blue-100">
                              <HiOutlineDocumentText className="h-3.5 w-3.5" />
                              {inv.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-brand-text">{inv.clientName}</p>
                            <p className="text-[10px] text-brand-dark-grey mt-0.5">{inv.companyName}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-brand-text">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 font-bold text-green-600">₹{inv.amountPaid.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-brand-dark-grey font-semibold capitalize">{inv.paymentMethod || 'Bank Transfer'}</td>
                          <td className="px-6 py-4">{getStatusBadge(inv.paymentStatus)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewingInvoice(inv)}
                                className="p-1.5"
                                title="View & Print Document"
                              >
                                <HiOutlineEye className="h-4.5 w-4.5 text-brand-dark-grey hover:text-primary" />
                              </Button>

                              {balance > 0 ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenRecord(inv)}
                                  leftIcon={<HiOutlinePlusCircle />}
                                  className="text-xs"
                                >
                                  Record Payment
                                </Button>
                              ) : (
                                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                                  Settled
                                </span>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmInvoice(inv)}
                                className="p-1.5 text-red-500 hover:text-red-700"
                                title="Delete Document"
                              >
                                <HiOutlineTrash className="h-4.5 w-4.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE & TABLET VIEW: Responsive Interactive Cards (block lg:hidden) */}
              <div className="block lg:hidden divide-y divide-brand-border">
                {filteredInvoices.map(inv => {
                  const balance = inv.grandTotal - inv.amountPaid;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setPreviewingInvoice(inv)}
                      className="p-4 transition-all duration-200 cursor-pointer text-left hover:bg-brand-light-grey/40 active:bg-blue-50/30"
                    >
                      {/* Top Bar: Invoice Number, Status Badge, and Delete Button */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-mono font-bold text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                          <HiOutlineDocumentText className="h-3.5 w-3.5" />
                          {inv.invoiceNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(inv.paymentStatus)}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmInvoice(inv);
                            }}
                            className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Delete invoice"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Card Content */}
                      <div className="mb-2.5">
                        <h4 className="font-extrabold text-sm text-brand-text leading-snug">{inv.clientName}</h4>
                        <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5 flex items-center gap-1">
                          <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          <span>{inv.companyName}</span>
                        </p>
                      </div>

                      {/* Financial Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 my-2">
                        <span className="text-[10px] font-extrabold bg-blue-50 text-primary border border-blue-200/60 px-2 py-0.5 rounded-md">
                          Total: ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded-md">
                          Paid: ₹{inv.amountPaid.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60 px-2 py-0.5 rounded-md">
                          Due: ₹{balance.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Footer: Payment Method & Actions */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2.5 mt-2 border-t border-brand-border/40">
                        <span className="text-[10px] font-medium text-stone-500">
                          {inv.paymentMethod || 'Bank Transfer'}
                        </span>
                        <div className="flex items-center gap-2">
                          {balance > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRecord(inv);
                              }}
                              className="text-[10px] font-bold text-primary bg-blue-50 px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              Record Payment
                            </button>
                          )}
                          <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 hover:underline">
                            View Document
                            <HiOutlineChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <EmptyState
                title="No Invoices Issued"
                description="Click 'Create Invoice' above to issue your first commercial document or tax invoice."
              />
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateInvoiceOpen(true)}
                  leftIcon={<HiOutlinePlusCircle />}
                >
                  Create Invoice
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Invoice Modal Form */}
      {isCreateInvoiceOpen && (
        <CreateInvoiceModal
          isOpen={isCreateInvoiceOpen}
          onClose={() => setIsCreateInvoiceOpen(false)}
        />
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Log Transaction Payment"
        size="sm"
      >
        {selectedRental && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-left text-xs">
            <div className="bg-brand-light-grey p-3 border border-brand-border rounded-xl space-y-1.5">
              <div className="flex justify-between">
                <span className="text-brand-dark-grey">Invoice Number:</span>
                <span className="font-bold text-brand-text">{selectedRental.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dark-grey">Total Grand Billing:</span>
                <span className="font-bold text-brand-text">₹{selectedRental.grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dark-grey">Total Amount Paid:</span>
                <span className="font-bold text-green-600">₹{selectedRental.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-[1px] bg-brand-border" />
              <div className="flex justify-between font-bold">
                <span className="text-brand-text">Remaining Balance Due:</span>
                <span className="text-red-600">₹{(selectedRental.grandTotal - selectedRental.amountPaid).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Input
              label="Transaction Amount Received (INR) *"
              type="number"
              required
              value={payAmount || ''}
              onChange={e => setPayAmount(Number(e.target.value))}
            />

            <Select
              label="Payment Channel Mode *"
              options={[
                { label: 'Bank Transfer (NEFT/RTGS)', value: 'Bank Transfer' },
                { label: 'UPI (GPay/PhonePe)', value: 'UPI' },
                { label: 'Cash Payment', value: 'Cash' },
                { label: 'Cheque Payment', value: 'Cheque' }
              ]}
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as any)}
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-brand-border">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Post Payment</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Invoice Document Preview & Print Modal */}
      {previewingInvoice && (
        <Modal
          isOpen={!!previewingInvoice}
          onClose={() => setPreviewingInvoice(null)}
          title="Document View & Audit"
          size="xl"
        >
          <div className="space-y-4">
            <InvoiceDocumentPreview
              data={mapRentalToPreviewData(previewingInvoice)}
              onClose={() => setPreviewingInvoice(null)}
            />
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewingInvoice(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {deleteConfirmInvoice && (
        <Modal
          isOpen={!!deleteConfirmInvoice}
          onClose={() => setDeleteConfirmInvoice(null)}
          title="Confirm Document Removal"
          size="sm"
        >
          <div className="space-y-4 text-left text-xs">
            <p className="text-stone-600 leading-relaxed">
              Are you sure you want to remove document{' '}
              <strong className="text-stone-900 font-mono">{deleteConfirmInvoice.invoiceNumber}</strong> issued for{' '}
              <strong className="text-stone-900">{deleteConfirmInvoice.clientName}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmInvoice(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
                Delete Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Payments;
