import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import {
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineChartPie,
  HiOutlineBriefcase,
  HiOutlineCreditCard,
  HiOutlineWrench,
  HiOutlineChevronRight,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineSquare3Stack3D,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays
} from 'react-icons/hi2';
import type { RentalRequest, InventoryItem, Client, MaintenanceRecord } from '../../types';

type ReportType = 'revenue' | 'inventory' | 'rentals' | 'clients' | 'maintenance';

export const Reports: React.FC = () => {
  const { clients, inventory, rentalRequests } = useData();
  const [reportType, setReportType] = useState<ReportType>('revenue');

  // Selected item states for mobile detail modal
  const [selectedRevenueItem, setSelectedRevenueItem] = useState<RentalRequest | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [selectedRentalItem, setSelectedRentalItem] = useState<RentalRequest | null>(null);
  const [selectedClientItem, setSelectedClientItem] = useState<Client | null>(null);
  const [selectedMaintenanceItem, setSelectedMaintenanceItem] = useState<{
    equipmentId: string;
    name: string;
    category: string;
    log: MaintenanceRecord;
  } | null>(null);

  // CSV Generator Utility
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Generator Utility (Excel-compatible XML/HTML Spreadsheet)
  const downloadExcel = (headers: string[], rows: string[][], filename: string) => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet 1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    html += `<body><table border="1">`;
    
    // Headers
    html += `<tr>`;
    headers.forEach(h => {
      html += `<th style="background-color: #e0e5ff; color: #2f37d6; font-weight: bold;">${h}</th>`;
    });
    html += `</tr>`;
    
    // Rows
    rows.forEach(row => {
      html += `<tr>`;
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += `</tr>`;
    });
    
    html += `</table></body></html>`;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Generator Utility
  const downloadPDF = (headers: string[], rows: string[][], filename: string) => {
    const doc = new jsPDF();
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("UNAI Infra Civil Equipment Rental", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("Helvetica", "normal");
    doc.text(`Report: ${filename.replace(/_/g, ' ')}`, 14, 28);
    doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);
    
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);
    
    let y = 46;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    
    const colWidth = 182 / headers.length;
    headers.forEach((h, i) => {
      doc.text(h, 14 + (i * colWidth), y);
    });
    
    y += 6;
    doc.line(14, y - 2, 196, y - 2);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    
    rows.forEach((row) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        headers.forEach((h, i) => {
          doc.text(h, 14 + (i * colWidth), y);
        });
        y += 6;
        doc.line(14, y - 2, 196, y - 2);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
      }
      
      row.forEach((cell, i) => {
        const val = String(cell || '');
        const maxChars = Math.max(10, Math.floor(colWidth / 1.5));
        const text = val.length > maxChars ? val.substring(0, maxChars - 2) + ".." : val;
        doc.text(text, 14 + (i * colWidth), y);
      });
      y += 6;
    });
    
    doc.save(`${filename}.pdf`);
  };

  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    toast.info(`Preparing ${reportType} report in ${format} format...`);
    
    // Generate data based on active report type
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (reportType === 'revenue') {
      headers = ['Invoice Number', 'Client Name', 'Billed Date', 'GST Tax', 'Discounts', 'Grand Total', 'Amount Paid', 'Balance Due'];
      rows = rentalRequests.filter(r => r.status === 'Approved').map(r => [
        r.invoiceNumber,
        r.clientName,
        r.invoiceDate || '',
        `INR ${r.gstTotal}`,
        `INR ${r.discountTotal}`,
        `INR ${r.grandTotal}`,
        `INR ${r.amountPaid}`,
        `INR ${r.grandTotal - r.amountPaid}`
      ]);
    } else if (reportType === 'inventory') {
      headers = ['Equipment ID', 'Asset Name', 'Category', 'Brand & Model', 'Status', 'Daily Rate', 'Purchase Price', 'Location'];
      rows = inventory.map(i => [
        i.equipmentId,
        i.name,
        i.category,
        `${i.brand} ${i.model}`,
        i.status,
        `INR ${i.rentalPriceDay}`,
        `INR ${i.purchasePrice}`,
        i.currentLocation
      ]);
    } else if (reportType === 'rentals') {
      headers = ['Rental Number', 'Client Name', 'Company Name', 'Start Date', 'Expected Return', 'Total Items', 'Grand Total', 'Status'];
      rows = rentalRequests.map(r => [
        r.rentalNumber || 'Pending',
        r.clientName,
        r.companyName,
        r.startDate,
        r.expectedReturnDate,
        r.items.length.toString(),
        `INR ${r.grandTotal}`,
        r.status
      ]);
    } else if (reportType === 'clients') {
      headers = ['Client ID', 'Client Name', 'Company Name', 'GSTIN', 'Phone', 'Email', 'City', 'Status'];
      rows = clients.map(c => [
        c.id,
        c.name,
        c.companyName,
        c.gstNumber || 'N/A',
        c.phone,
        c.email,
        c.city || 'N/A',
        c.status
      ]);
    } else if (reportType === 'maintenance') {
      headers = ['Equipment ID', 'Asset Name', 'Maintenance Date', 'Service Action', 'Technician', 'Repair Cost (INR)'];
      rows = [];
      inventory.forEach(item => {
        item.maintenanceHistory.forEach(log => {
          rows.push([
            item.equipmentId,
            item.name,
            log.date,
            log.type,
            log.technician,
            log.cost.toString()
          ]);
        });
      });
    }

    const filename = `UNAI_Infra_${reportType}_Report_${Date.now()}`;

    if (format === 'CSV') {
      downloadCSV(headers, rows, filename);
      toast.success(`${reportType} CSV exported successfully!`);
    } else if (format === 'Excel') {
      downloadExcel(headers, rows, filename);
      toast.success(`${reportType} Excel exported successfully!`);
    } else if (format === 'PDF') {
      downloadPDF(headers, rows, filename);
      toast.success(`${reportType} PDF compiled and downloaded successfully!`);
    }
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-lg font-extrabold text-brand-text tracking-tight m-0">Corporate Reports & Analytics</h1>
          <p className="text-xs text-brand-dark-grey mt-0.5">Export operational metrics, maintenance schedules, tax invoices, and accounting audits.</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')} leftIcon={<HiOutlineArrowDownTray />} className="shrink-0">
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('Excel')} className="shrink-0">
            Excel
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport('PDF')} leftIcon={<HiOutlineDocumentText />} className="shrink-0">
            Download PDF
          </Button>
        </div>
      </div>

      {/* Selector Side Panel + Visualizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left selector */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 whitespace-nowrap">
          <button
            onClick={() => setReportType('revenue')}
            className={`px-4 py-2.5 md:py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 ${
              reportType === 'revenue'
                ? 'bg-blue-50 border-blue-100 text-primary shadow-xs'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineCreditCard className="h-4 w-4 shrink-0" />
            <span>Revenue</span>
          </button>
          
          <button
            onClick={() => setReportType('inventory')}
            className={`px-4 py-2.5 md:py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 ${
              reportType === 'inventory'
                ? 'bg-blue-50 border-blue-100 text-primary shadow-xs'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineChartPie className="h-4 w-4 shrink-0" />
            <span>Inventory</span>
          </button>
          
          <button
            onClick={() => setReportType('rentals')}
            className={`px-4 py-2.5 md:py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 ${
              reportType === 'rentals'
                ? 'bg-blue-50 border-blue-100 text-primary shadow-xs'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineDocumentText className="h-4 w-4 shrink-0" />
            <span>Rentals</span>
          </button>

          <button
            onClick={() => setReportType('clients')}
            className={`px-4 py-2.5 md:py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 ${
              reportType === 'clients'
                ? 'bg-blue-50 border-blue-100 text-primary shadow-xs'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineBriefcase className="h-4 w-4 shrink-0" />
            <span>Clients</span>
          </button>

          <button
            onClick={() => setReportType('maintenance')}
            className={`px-4 py-2.5 md:py-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 ${
              reportType === 'maintenance'
                ? 'bg-blue-50 border-blue-100 text-primary shadow-xs'
                : 'bg-white border-brand-border text-brand-dark-grey hover:bg-brand-light-grey'
            }`}
          >
            <HiOutlineWrench className="h-4 w-4 shrink-0" />
            <span>Maintenance</span>
          </button>
        </div>

        {/* Right Details Table */}
        <Card className="md:col-span-3">
          <CardHeader>
            <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider capitalize">{reportType} Report Analysis</h3>
            <span className="text-[10px] text-brand-dark-grey font-medium">Real-time entries in active database</span>
          </CardHeader>
          <CardBody className="p-0">
            {reportType === 'revenue' && (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Invoice No</th>
                        <th className="px-4 py-3">Client Representative</th>
                        <th className="px-4 py-3">GST Tax</th>
                        <th className="px-4 py-3">Grand Total</th>
                        <th className="px-4 py-3">Paid Amount</th>
                        <th className="px-4 py-3">Dues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {rentalRequests.filter(r => r.status === 'Approved').map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-bold text-brand-text font-mono">{r.invoiceNumber}</td>
                          <td className="px-4 py-3 font-semibold text-brand-text">{r.clientName}</td>
                          <td className="px-4 py-3 font-medium text-brand-text">₹{r.gstTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-brand-text">₹{r.grandTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-green-600">₹{r.amountPaid.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-red-600">₹{(r.grandTotal - r.amountPaid).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE & TABLET CARDS */}
                <div className="block lg:hidden divide-y divide-brand-border">
                  {rentalRequests.filter(r => r.status === 'Approved').length === 0 ? (
                    <div className="p-6 text-center text-brand-dark-grey italic">No approved revenue records found.</div>
                  ) : (
                    rentalRequests.filter(r => r.status === 'Approved').map(r => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRevenueItem(r)}
                        className="p-4 transition-all duration-200 cursor-pointer text-left hover:bg-brand-light-grey/40 active:bg-blue-50/30"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                            <HiOutlineDocumentText className="h-3.5 w-3.5" />
                            {r.invoiceNumber}
                          </span>
                          <span className="text-xs font-extrabold text-primary">
                            ₹{r.grandTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="mb-2">
                          <h4 className="font-extrabold text-sm text-brand-text leading-snug">{r.clientName}</h4>
                          <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5">{r.companyName}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 my-2">
                          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded-md">
                            Paid: ₹{r.amountPaid.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60 px-2 py-0.5 rounded-md">
                            Due: ₹{(r.grandTotal - r.amountPaid).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200/60 px-2 py-0.5 rounded-md">
                            GST: ₹{r.gstTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-brand-border/40">
                          <span className="flex items-center gap-1 truncate font-medium">
                            <HiOutlineCalendarDays className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            {r.startDate} → {r.expectedReturnDate}
                          </span>
                          <span className="text-[10px] font-semibold text-primary shrink-0 flex items-center gap-0.5 hover:underline">
                            Tap for entire details
                            <HiOutlineChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {reportType === 'inventory' && (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Equipment ID</th>
                        <th className="px-4 py-3">Asset Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Daily Rent Rate</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {inventory.map(i => (
                        <tr key={i.id}>
                          <td className="px-4 py-3 font-bold text-brand-text font-mono">{i.equipmentId}</td>
                          <td className="px-4 py-3 font-semibold text-brand-text">{i.name}</td>
                          <td className="px-4 py-3 font-medium text-brand-dark-grey">{i.category}</td>
                          <td className="px-4 py-3 font-bold text-primary">₹{i.rentalPriceDay.toLocaleString()}/day</td>
                          <td className="px-4 py-3"><Badge variant={i.status === 'Available' ? 'success' : 'brand'}>{i.status}</Badge></td>
                          <td className="px-4 py-3 font-medium text-brand-text">{i.currentLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE & TABLET CARDS */}
                <div className="block lg:hidden divide-y divide-brand-border">
                  {inventory.length === 0 ? (
                    <div className="p-6 text-center text-brand-dark-grey italic">No inventory assets recorded.</div>
                  ) : (
                    inventory.map(i => (
                      <div
                        key={i.id}
                        onClick={() => setSelectedInventoryItem(i)}
                        className="p-4 transition-all duration-200 cursor-pointer text-left hover:bg-brand-light-grey/40 active:bg-blue-50/30"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                            <HiOutlineSquare3Stack3D className="h-3.5 w-3.5" />
                            {i.equipmentId}
                          </span>
                          <Badge variant={i.status === 'Available' ? 'success' : 'brand'}>{i.status}</Badge>
                        </div>

                        <div className="flex items-start gap-3">
                          {i.images[0] ? (
                            <img src={i.images[0]} alt={i.name} className="h-14 w-14 rounded-xl object-cover border border-brand-border shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-xl border border-dashed border-brand-border bg-brand-light-grey flex items-center justify-center shrink-0">
                              <HiOutlineSquare3Stack3D className="h-6 w-6 text-brand-dark-grey opacity-40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-sm text-brand-text leading-snug line-clamp-1">{i.name}</h4>
                            <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5 truncate">{i.brand} • {i.model}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[10px] bg-brand-light-grey text-brand-dark-grey font-semibold px-2 py-0.5 rounded-md border border-brand-border/60">
                                {i.category}
                              </span>
                              <span className="text-xs font-extrabold text-primary">
                                ₹{i.rentalPriceDay.toLocaleString()}<span className="text-[10px] font-normal text-stone-400">/day</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2.5 pt-2 border-t border-brand-border/40">
                          <span className="flex items-center gap-1 truncate font-medium">
                            <HiOutlineMapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            {i.currentLocation}
                          </span>
                          <span className="text-[10px] font-semibold text-primary shrink-0 flex items-center gap-0.5 hover:underline">
                            Tap for entire details
                            <HiOutlineChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {reportType === 'rentals' && (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Rental Number</th>
                        <th className="px-4 py-3">Client Representative</th>
                        <th className="px-4 py-3">Company Name</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">Expected Return</th>
                        <th className="px-4 py-3">Grand Total</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {rentalRequests.map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-bold text-brand-text font-mono">{r.rentalNumber || 'Pending Approval'}</td>
                          <td className="px-4 py-3 font-semibold text-brand-text">{r.clientName}</td>
                          <td className="px-4 py-3 font-medium text-brand-dark-grey">{r.companyName}</td>
                          <td className="px-4 py-3 font-semibold text-brand-text">{r.startDate}</td>
                          <td className="px-4 py-3 font-semibold text-brand-text">{r.expectedReturnDate}</td>
                          <td className="px-4 py-3 font-bold text-primary">₹{r.grandTotal.toLocaleString()}</td>
                          <td className="px-4 py-3"><Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE & TABLET CARDS */}
                <div className="block lg:hidden divide-y divide-brand-border">
                  {rentalRequests.length === 0 ? (
                    <div className="p-6 text-center text-brand-dark-grey italic">No rental requests found.</div>
                  ) : (
                    rentalRequests.map(r => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRentalItem(r)}
                        className="p-4 transition-all duration-200 cursor-pointer text-left hover:bg-brand-light-grey/40 active:bg-blue-50/30"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                            <HiOutlineDocumentText className="h-3.5 w-3.5" />
                            {r.rentalNumber || 'Pending Approval'}
                          </span>
                          <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>
                            {r.status}
                          </Badge>
                        </div>

                        <div className="mb-2">
                          <h4 className="font-extrabold text-sm text-brand-text leading-snug">{r.clientName}</h4>
                          <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5">{r.companyName}</p>
                        </div>

                        <div className="flex items-center justify-between my-2">
                          <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                            {r.items?.length || 1} items
                          </span>
                          <span className="text-xs font-extrabold text-primary">
                            Total: ₹{r.grandTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-brand-border/40">
                          <span className="flex items-center gap-1 truncate font-medium">
                            <HiOutlineCalendarDays className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            {r.startDate} → {r.expectedReturnDate}
                          </span>
                          <span className="text-[10px] font-semibold text-primary shrink-0 flex items-center gap-0.5 hover:underline">
                            Tap for entire details
                            <HiOutlineChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {reportType === 'clients' && (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Client Representative Name</th>
                        <th className="px-4 py-3">Company Name</th>
                        <th className="px-4 py-3">GSTIN Tax Registration</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">City</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {clients.map(c => (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-bold text-brand-text">{c.name}</td>
                          <td className="px-4 py-3 font-semibold text-brand-text">{c.companyName}</td>
                          <td className="px-4 py-3 font-bold text-brand-text font-mono">{c.gstNumber}</td>
                          <td className="px-4 py-3 font-medium text-brand-dark-grey">{c.phone}</td>
                          <td className="px-4 py-3 font-medium text-brand-dark-grey">{c.email}</td>
                          <td className="px-4 py-3 font-medium text-brand-text">{c.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE & TABLET CARDS */}
                <div className="block lg:hidden divide-y divide-brand-border">
                  {clients.length === 0 ? (
                    <div className="p-6 text-center text-brand-dark-grey italic">No client records found.</div>
                  ) : (
                    clients.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClientItem(c)}
                        className="p-4 transition-all duration-200 cursor-pointer text-left hover:bg-brand-light-grey/40 active:bg-blue-50/30"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5 truncate max-w-[220px]">
                            <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{c.companyName}</span>
                          </span>
                          <Badge variant={c.status === 'Active' ? 'success' : 'neutral'}>{c.status}</Badge>
                        </div>

                        <div className="mb-2">
                          <h4 className="font-extrabold text-sm text-brand-text leading-snug">{c.name}</h4>
                          <p className="text-[10px] font-mono text-stone-500 mt-0.5">GSTIN: {c.gstNumber || 'N/A'}</p>
                        </div>

                        <div className="space-y-0.5 text-[11px] text-brand-dark-grey font-medium my-2">
                          <span className="flex items-center gap-1.5 truncate">
                            <HiOutlineEnvelope className="h-3.5 w-3.5 text-stone-400 shrink-0" /> {c.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <HiOutlinePhone className="h-3.5 w-3.5 text-stone-400 shrink-0" /> {c.phone}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-brand-border/40">
                          <span className="flex items-center gap-1 truncate font-medium">
                            <HiOutlineMapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            {c.city || 'N/A'}, {c.state || ''}
                          </span>
                          <span className="text-[10px] font-semibold text-primary shrink-0 flex items-center gap-0.5 hover:underline">
                            Tap for entire details
                            <HiOutlineChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {reportType === 'maintenance' && (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-light-grey border-b border-brand-border text-brand-dark-grey font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Equipment ID</th>
                        <th className="px-4 py-3">Asset Name</th>
                        <th className="px-4 py-3">Service Action Type</th>
                        <th className="px-4 py-3">Maintenance Date</th>
                        <th className="px-4 py-3">Technician</th>
                        <th className="px-4 py-3 text-right">Repair Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {(() => {
                        const rows: React.ReactNode[] = [];
                        inventory.forEach(item => {
                          item.maintenanceHistory.forEach(log => {
                            rows.push(
                              <tr key={log.id}>
                                <td className="px-4 py-3 font-bold text-brand-text font-mono">{item.equipmentId}</td>
                                <td className="px-4 py-3 font-semibold text-brand-text">{item.name}</td>
                                <td className="px-4 py-3 font-semibold text-brand-text">{log.type}</td>
                                <td className="px-4 py-3 font-medium text-brand-dark-grey">{log.date}</td>
                                <td className="px-4 py-3 font-medium text-brand-dark-grey">{log.technician}</td>
                                <td className="px-4 py-3 text-right font-bold text-primary">₹{log.cost.toLocaleString()}</td>
                              </tr>
                            );
                          });
                        });
                        return rows.length > 0 ? rows : (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-brand-dark-grey italic">No maintenance actions recorded.</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE & TABLET CARDS */}
                <div className="block lg:hidden divide-y divide-brand-border">
                  {(() => {
                    const cards: React.ReactNode[] = [];
                    inventory.forEach(item => {
                      item.maintenanceHistory.forEach(log => {
                        cards.push(
                          <div
                            key={log.id}
                            onClick={() => setSelectedMaintenanceItem({ equipmentId: item.equipmentId, name: item.name, category: item.category, log })}
                            className="p-4 transition-all duration-200 cursor-pointer text-left hover:bg-brand-light-grey/40 active:bg-blue-50/30"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono font-bold text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-lg border border-blue-200/60 inline-flex items-center gap-1.5">
                                <HiOutlineSquare3Stack3D className="h-3.5 w-3.5" />
                                {item.equipmentId}
                              </span>
                              <span className="text-xs font-extrabold text-primary">
                                ₹{log.cost.toLocaleString()}
                              </span>
                            </div>

                            <div className="mb-2">
                              <h4 className="font-extrabold text-sm text-brand-text leading-snug">{item.name}</h4>
                              <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5">{log.type} • Tech: {log.technician}</p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-brand-border/40">
                              <span className="flex items-center gap-1 truncate font-medium">
                                <HiOutlineCalendarDays className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                {log.date}
                              </span>
                              <span className="text-[10px] font-semibold text-primary shrink-0 flex items-center gap-0.5 hover:underline">
                                Tap for entire details
                                <HiOutlineChevronRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      });
                    });
                    return cards.length > 0 ? cards : (
                      <div className="p-6 text-center text-brand-dark-grey italic">No maintenance actions recorded.</div>
                    );
                  })()}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Revenue Detail Modal */}
      {selectedRevenueItem && (
        <Modal
          isOpen={!!selectedRevenueItem}
          onClose={() => setSelectedRevenueItem(null)}
          headerActions={
            <Button variant="outline" size="sm" onClick={() => setSelectedRevenueItem(null)}>
              Close Details
            </Button>
          }
          showCloseButton={false}
          size="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey tracking-wider">Invoice Details</span>
                <h3 className="text-base font-extrabold text-brand-text font-mono mt-0.5">{selectedRevenueItem.invoiceNumber}</h3>
              </div>
              <Badge variant={selectedRevenueItem.status === 'Approved' ? 'success' : 'neutral'}>
                {selectedRevenueItem.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-brand-light-grey/40 p-3.5 rounded-xl border border-brand-border/60">
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Client Name</span>
                <span className="font-bold text-brand-text text-xs">{selectedRevenueItem.clientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Company Name</span>
                <span className="font-bold text-brand-text text-xs">{selectedRevenueItem.companyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Rental Period</span>
                <span className="font-medium text-brand-text text-xs">{selectedRevenueItem.startDate} to {selectedRevenueItem.expectedReturnDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Rental ID</span>
                <span className="font-mono text-brand-text text-xs">{selectedRevenueItem.rentalNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-brand-dark-grey font-medium">GST Tax</span>
                <span className="font-bold text-brand-text">₹{selectedRevenueItem.gstTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-dark-grey font-medium">Grand Total</span>
                <span className="font-extrabold text-primary text-sm">₹{selectedRevenueItem.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-blue-200/60">
                <span className="text-green-700 font-bold">Amount Paid</span>
                <span className="font-bold text-green-700">₹{selectedRevenueItem.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-600 font-bold">Balance Due</span>
                <span className="font-bold text-red-600">₹{(selectedRevenueItem.grandTotal - selectedRevenueItem.amountPaid).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Inventory Item Detail Modal */}
      {selectedInventoryItem && (
        <Modal
          isOpen={!!selectedInventoryItem}
          onClose={() => setSelectedInventoryItem(null)}
          headerActions={
            <Button variant="outline" size="sm" onClick={() => setSelectedInventoryItem(null)}>
              Close Details
            </Button>
          }
          showCloseButton={false}
          size="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey tracking-wider">Equipment Asset</span>
                <h3 className="text-base font-extrabold text-brand-text font-mono mt-0.5">{selectedInventoryItem.equipmentId}</h3>
              </div>
              <Badge variant={selectedInventoryItem.status === 'Available' ? 'success' : 'brand'}>
                {selectedInventoryItem.status}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {selectedInventoryItem.images[0] ? (
                <img src={selectedInventoryItem.images[0]} alt={selectedInventoryItem.name} className="h-16 w-20 rounded-xl object-cover border border-brand-border" />
              ) : null}
              <div>
                <h4 className="font-extrabold text-sm text-brand-text">{selectedInventoryItem.name}</h4>
                <p className="text-xs text-brand-dark-grey font-medium">{selectedInventoryItem.brand} • {selectedInventoryItem.model}</p>
                <span className="inline-block mt-1 text-[10px] bg-brand-light-grey text-brand-dark-grey font-semibold px-2 py-0.5 rounded-md border border-brand-border/60">
                  {selectedInventoryItem.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-brand-light-grey/40 p-3.5 rounded-xl border border-brand-border/60">
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Daily Rent Rate</span>
                <span className="font-extrabold text-primary text-xs">₹{selectedInventoryItem.rentalPriceDay.toLocaleString()}/day</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Current Yard Location</span>
                <span className="font-medium text-brand-text text-xs">{selectedInventoryItem.currentLocation}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Serial Number</span>
                <span className="font-mono text-brand-text text-xs">{selectedInventoryItem.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Purchase Price</span>
                <span className="font-medium text-brand-text text-xs">₹{selectedInventoryItem.purchasePrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Rental Detail Modal */}
      {selectedRentalItem && (
        <Modal
          isOpen={!!selectedRentalItem}
          onClose={() => setSelectedRentalItem(null)}
          headerActions={
            <Button variant="outline" size="sm" onClick={() => setSelectedRentalItem(null)}>
              Close Details
            </Button>
          }
          showCloseButton={false}
          size="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey tracking-wider">Rental Order</span>
                <h3 className="text-base font-extrabold text-brand-text font-mono mt-0.5">{selectedRentalItem.rentalNumber || 'Pending'}</h3>
              </div>
              <Badge variant={selectedRentalItem.status === 'Approved' ? 'success' : selectedRentalItem.status === 'Pending' ? 'warning' : 'danger'}>
                {selectedRentalItem.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-brand-light-grey/40 p-3.5 rounded-xl border border-brand-border/60">
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Client Name</span>
                <span className="font-bold text-brand-text text-xs">{selectedRentalItem.clientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Company Name</span>
                <span className="font-bold text-brand-text text-xs">{selectedRentalItem.companyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Start Date</span>
                <span className="font-medium text-brand-text text-xs">{selectedRentalItem.startDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Expected Return</span>
                <span className="font-medium text-brand-text text-xs">{selectedRentalItem.expectedReturnDate}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-between">
              <span className="font-semibold text-brand-text">Grand Total Amount</span>
              <span className="text-base font-extrabold text-primary">₹{selectedRentalItem.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Client Detail Modal */}
      {selectedClientItem && (
        <Modal
          isOpen={!!selectedClientItem}
          onClose={() => setSelectedClientItem(null)}
          headerActions={
            <Button variant="outline" size="sm" onClick={() => setSelectedClientItem(null)}>
              Close Details
            </Button>
          }
          showCloseButton={false}
          size="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey tracking-wider">Client Profile</span>
                <h3 className="text-base font-extrabold text-brand-text mt-0.5">{selectedClientItem.name}</h3>
              </div>
              <Badge variant={selectedClientItem.status === 'Active' ? 'success' : 'neutral'}>
                {selectedClientItem.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-brand-light-grey/40 p-3.5 rounded-xl border border-brand-border/60">
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Company</span>
                <span className="font-bold text-brand-text text-xs">{selectedClientItem.companyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">GSTIN</span>
                <span className="font-mono text-brand-text text-xs">{selectedClientItem.gstNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Email</span>
                <span className="font-medium text-brand-text text-xs truncate">{selectedClientItem.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Phone</span>
                <span className="font-medium text-brand-text text-xs">{selectedClientItem.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-brand-dark-grey font-semibold block">City & State</span>
                <span className="font-medium text-brand-text text-xs">{selectedClientItem.city || 'N/A'}, {selectedClientItem.state || ''}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Maintenance Detail Modal */}
      {selectedMaintenanceItem && (
        <Modal
          isOpen={!!selectedMaintenanceItem}
          onClose={() => setSelectedMaintenanceItem(null)}
          headerActions={
            <Button variant="outline" size="sm" onClick={() => setSelectedMaintenanceItem(null)}>
              Close Details
            </Button>
          }
          showCloseButton={false}
          size="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey tracking-wider">Maintenance Record</span>
                <h3 className="text-base font-extrabold text-brand-text font-mono mt-0.5">{selectedMaintenanceItem.equipmentId}</h3>
              </div>
              <span className="text-xs font-extrabold text-primary bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                ₹{selectedMaintenanceItem.log.cost.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-brand-light-grey/40 p-3.5 rounded-xl border border-brand-border/60">
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Equipment Name</span>
                <span className="font-bold text-brand-text text-xs">{selectedMaintenanceItem.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Action Type</span>
                <span className="font-semibold text-brand-text text-xs">{selectedMaintenanceItem.log.type}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Technician</span>
                <span className="font-medium text-brand-text text-xs">{selectedMaintenanceItem.log.technician}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-dark-grey font-semibold block">Date</span>
                <span className="font-medium text-brand-text text-xs">{selectedMaintenanceItem.log.date}</span>
              </div>
              {selectedMaintenanceItem.log.description && (
                <div className="col-span-2">
                  <span className="text-[10px] text-brand-dark-grey font-semibold block">Work Description</span>
                  <p className="font-medium text-brand-dark-grey text-xs mt-0.5">{selectedMaintenanceItem.log.description}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Reports;
