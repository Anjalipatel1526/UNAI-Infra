import React from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineWrenchScrewdriver,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCalendar,
  HiOutlineClipboardDocumentList
} from 'react-icons/hi2';

export const EmployeeDashboard: React.FC = () => {
  const { clients, inventory, rentalRequests, activityLogs } = useData();
  const navigate = useNavigate();

  // Employee-specific calculations
  const assignedClients = clients.slice(0, 3); // Mock assigned clients
  const pendingInspectionCount = inventory.filter(i => i.status === 'Maintenance' || i.status === 'Damaged').length;
  const activeRentalsCount = rentalRequests.filter(r => r.status === 'Approved').length;
  const returnsDueSoon = rentalRequests.filter(r => r.status === 'Approved').slice(0, 2);

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-brand-text tracking-tight m-0">Operations Dashboard</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Manage daily rentals dispatching, returns, and inventory audits.</p>
        </div>

        <div className="flex gap-2.5">
          <Button variant="outline" size="sm" onClick={() => navigate('/employee/availability')} leftIcon={<HiOutlineCalendar />}>
            Availability Checker
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/employee/returns')} leftIcon={<HiOutlineClipboardDocumentList />}>
            Returns Log
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-primary rounded-xl border border-blue-100">
              <HiOutlineUserGroup className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Assigned Customers</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">{assignedClients.length} Profiles</h3>
              <p className="text-[10px] text-brand-dark-grey font-semibold mt-0.5">Direct contact supervisor</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-brand-dark-grey rounded-xl border border-brand-border">
              <HiOutlineCheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Active Rental Projects</span>
              <h3 className="text-lg font-extrabold text-brand-text mt-0.5">{activeRentalsCount} Sites</h3>
              <p className="text-[10px] text-brand-dark-grey font-semibold mt-0.5">Dispatched & operational</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100">
              <HiOutlineWrenchScrewdriver className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Pending Inspections</span>
              <h3 className="text-lg font-extrabold text-yellow-600 mt-0.5">{pendingInspectionCount} Units</h3>
              <p className="text-[10px] text-yellow-600 font-bold mt-0.5">Awaiting depot testing</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <HiOutlineClock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-dark-grey uppercase tracking-wider">Returns Due Week</span>
              <h3 className="text-lg font-extrabold text-red-600 mt-0.5">{returnsDueSoon.length} Projects</h3>
              <p className="text-[10px] text-red-600 font-bold mt-0.5">Requires return transport planning</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Clients */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Your Assigned Corporate Accounts</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-brand-border">
              {assignedClients.map(client => (
                <div key={client.id} className="p-4 flex items-center justify-between hover:bg-brand-light-grey/40 transition-colors">
                  <div>
                    <span className="font-bold text-brand-text block text-sm">{client.name}</span>
                    <span className="text-[10px] text-brand-dark-grey block mt-0.5">{client.companyName} • GSTIN: {client.gstNumber}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-brand-dark-grey font-medium">{client.phone}</span>
                    <Badge variant={client.status === 'Active' ? 'success' : 'neutral'}>{client.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick Schedule Returns */}
        <Card>
          <CardHeader>
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Upcoming Returns (48h)</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-brand-border">
              {returnsDueSoon.length > 0 ? (
                returnsDueSoon.map(ret => (
                  <div key={ret.id} className="p-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-brand-text block">{ret.companyName}</span>
                      <Badge variant="warning">Due Soon</Badge>
                    </div>
                    <p className="text-[10px] text-brand-dark-grey">Return Date: <strong>{ret.expectedReturnDate}</strong></p>
                    <p className="text-[10px] text-brand-dark-grey mt-0.5">Asset ID: <strong>{ret.items[0]?.equipmentId}</strong></p>
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-brand-dark-grey italic">No upcoming returns scheduled.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Operation Logs */}
      <Card>
        <CardHeader>
          <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Your Recent Logs & Updates</h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-brand-border">
            {activityLogs.slice(0, 4).map(log => (
              <div key={log.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-brand-light-grey/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={log.type === 'rental' ? 'brand' : 'success'}>{log.type}</Badge>
                  <div>
                    <p className="font-semibold text-brand-text">{log.details}</p>
                    <p className="text-[10px] text-brand-dark-grey mt-0.5">Timestamp: {new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
export default EmployeeDashboard;
