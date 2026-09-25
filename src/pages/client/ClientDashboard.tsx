import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCurrencyRupee,
  HiOutlineWrenchScrewdriver,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineShoppingBag
} from 'react-icons/hi2';

import { EmptyState } from '../../components/ui/EmptyState';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { clients, rentalRequests } = useData();
  const navigate = useNavigate();

  // Find client matching the logged-in user
  const clientProfile = clients.find(c => c.email === user?.email || c.name === user?.name) || clients[0];

  // Filter rentals belonging to this client
  const clientRentals = rentalRequests.filter(r => 
    r.companyName === clientProfile?.companyName || 
    r.clientName === clientProfile?.name
  );

  // Financial stats
  const activeRentals = clientRentals.filter(r => r.status === 'Approved');
  const totalBilled = activeRentals.reduce((sum, r) => sum + r.grandTotal, 0);
  const totalPaid = activeRentals.reduce((sum, r) => sum + r.amountPaid, 0);
  const outstandingBalance = totalBilled - totalPaid;
  
  const rentedItemsCount = activeRentals.reduce((sum, r) => sum + r.items.length, 0);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge variant="success">Paid</Badge>;
      case 'Partial': return <Badge variant="brand">Partial</Badge>;
      case 'Pending': return <Badge variant="warning">Pending</Badge>;
      case 'Overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-brand-text tracking-tight m-0">Welcome, {clientProfile?.name || 'Client'}</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Manage your active machinery leases, check statements, and place order requests.</p>
        </div>
        
        <Button variant="primary" size="sm" onClick={() => navigate('/client/cart')} leftIcon={<HiOutlineShoppingBag />}>
          Browse Rental Catalog
        </Button>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <HiOutlineCurrencyRupee className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Outstanding Dues</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">₹{outstandingBalance.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-red-600 font-bold mt-0.5">Billed balance statement</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-primary rounded-xl border border-blue-100">
              <HiOutlineWrenchScrewdriver className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Active Assets On-Site</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">{rentedItemsCount} Units</h3>
              <p className="text-[10px] text-brand-dark-grey font-semibold mt-0.5">Across {activeRentals.length} project codes</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-brand-dark-grey rounded-xl border border-brand-border">
              <HiOutlineDocumentText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Total Contracts Billed</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">{clientRentals.length} Orders</h3>
              <p className="text-[10px] text-brand-dark-grey font-semibold mt-0.5">Including pending approvals</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
              <HiOutlineClock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Corporate Account</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">{clientProfile?.companyName || 'L&T'}</h3>
              <p className="text-[10px] text-green-600 font-bold mt-0.5">Verified GST Profile</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Rentals Table list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Current Leased Equipment</h3>
          </CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            {activeRentals.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Asset Description</th>
                    <th className="px-4 py-3">Contract Ref</th>
                    <th className="px-4 py-3">Scheduled Return</th>
                    <th className="px-4 py-3">Daily Rent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {activeRentals.flatMap(rent => 
                    rent.items.map((item, idx) => (
                      <tr key={`${rent.id}-${idx}`}>
                        <td className="px-4 py-3 font-semibold text-brand-text">
                          {item.equipmentName}
                          <span className="block text-[10px] text-brand-dark-grey mt-0.5">ID: {item.equipmentId}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-brand-text font-mono">{rent.rentalNumber}</td>
                        <td className="px-4 py-3 font-bold text-brand-text">{rent.expectedReturnDate}</td>
                        <td className="px-4 py-3 font-bold text-primary">₹{item.dailyCharges.toLocaleString('en-IN')}/day</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState title="No Active Leases" description="You do not have any equipment dispatched to your project locations currently." />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick request card widget */}
        <Card>
          <CardHeader>
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider font-sans">Quick Order Request</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-[11px] text-brand-dark-grey leading-relaxed">
              Need to add another excavator, concrete mixer, pump, or road roller to your job site immediately?
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[10px] text-brand-text font-medium leading-relaxed">
              <span className="font-bold text-primary block mb-0.5">Account Dispatch Yard:</span>
              Your pre-approved site location is registered. Standard tax rates apply automatically at checkout.
            </div>
            <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/client/cart')}>
              Launch Booking Catalog
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Invoice Summaries statements */}
      <Card>
        <CardHeader>
          <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Billed Statements & Tax Invoices</h3>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {clientRentals.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Issued Date</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Amount Cleared</th>
                  <th className="px-4 py-3">Outstanding Dues</th>
                  <th className="px-4 py-3">Statement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {clientRentals.map(rent => {
                  const bal = rent.grandTotal - rent.amountPaid;
                  return (
                    <tr key={rent.id}>
                      <td className="px-4 py-3 font-bold text-brand-text font-mono">{rent.invoiceNumber || 'Awaiting Approval'}</td>
                      <td className="px-4 py-3 font-semibold text-brand-text">{rent.invoiceDate || 'N/A'}</td>
                      <td className="px-4 py-3 font-bold text-brand-text">₹{rent.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">₹{rent.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-red-600">₹{bal.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">{getPaymentStatusBadge(rent.paymentStatus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="No statements" description="Statements will appear once your rental requests are approved by administration." />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
export default ClientDashboard;
