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
  HiOutlineClock
} from 'react-icons/hi2';

export const Payments: React.FC = () => {
  const { rentalRequests, recordPayment, logActivity } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalRequest | null>(null);

  // Form states
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer'>('Bank Transfer');

  // Filter approved rentals that have invoices
  const invoices = rentalRequests.filter(r => r.status === 'Approved');

  // Calculations
  const receivedAmount = invoices.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalInvoiced = invoices.reduce((sum, r) => sum + r.grandTotal, 0);
  const outstandingAmount = totalInvoiced - receivedAmount;
  const overdueAmount = invoices
    .filter(r => r.paymentStatus === 'Overdue')
    .reduce((sum, r) => sum + (r.grandTotal - r.amountPaid), 0);

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
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
      toast.error(`Payment amount cannot exceed the balance due of ₹${remainingBalance.toLocaleString()}`);
      return;
    }

    recordPayment(selectedRental.id, payAmount, payMethod);
    logActivity(
      user?.name || 'Admin',
      'admin',
      'Recorded Payment',
      'payment',
      `Recorded payment of ₹${payAmount.toLocaleString()} for Invoice ${selectedRental.invoiceNumber} via ${payMethod}`
    );

    toast.success(`Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully!`);
    setIsPaymentModalOpen(false);
    setSelectedRental(null);
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Payments Ledger</h1>
        <p className="text-xs text-brand-dark-grey mt-0.5">Track invoice collections, log incoming transactions, and manage overdue balances.</p>
      </div>

      {/* Financial Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
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
            <div className="p-3 bg-blue-50 text-primary rounded-xl border border-blue-100">
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
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
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
            <div className="p-3 bg-gray-50 text-brand-dark-grey rounded-xl border border-brand-border">
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
                placeholder="Search by client name, invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg text-xs transition-all focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none focus:border-primary text-brand-text font-medium"
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

      {/* Invoices List Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {filteredInvoices.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Client representative</th>
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
                    <tr key={inv.id} className="hover:bg-brand-light-grey/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-brand-text font-mono">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-brand-text">{inv.clientName}</p>
                        <p className="text-[10px] text-brand-dark-grey mt-0.5">{inv.companyName}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-text">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-green-600">₹{inv.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-brand-dark-grey font-semibold capitalize">{inv.paymentMethod || 'N/A'}</td>
                      <td className="px-6 py-4">{getStatusBadge(inv.paymentStatus)}</td>
                      <td className="px-6 py-4 text-right flex justify-end mt-1.5">
                        {balance > 0 ? (
                          <Button variant="primary" size="sm" onClick={() => handleOpenRecord(inv)} leftIcon={<HiOutlinePlusCircle />}>
                            Record Payment
                          </Button>
                        ) : (
                          <Badge variant="success">Fully Settled</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No Invoices Issued" description="No approved rentals found." />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Log Transaction Payment" size="sm">
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
    </div>
  );
};
export default Payments;
