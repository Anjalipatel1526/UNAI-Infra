import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { toast } from 'react-toastify';
import {
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowPath,
  HiOutlinePhoto,
  HiOutlineArrowDownTray
} from 'react-icons/hi2';
import {
  InvoiceDocumentPreview,
  generateAndDownloadInvoicePDF,
  type InvoicePreviewData
} from './InvoiceDocumentPreview';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated?: (invoice: any) => void;
}

interface ItemRow {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
}

const DEFAULT_TERMS = 'Payment due within 15 days of invoice date. 1.5% monthly interest on overdue balances.';

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated
}) => {
  const { clients, rentalRequests, createInvoice, logActivity } = useData();
  const { user } = useAuth();

  // Document Type: Invoice, Voucher, Receipt
  const [docType, setDocType] = useState<'Invoice' | 'Voucher' | 'Receipt'>('Invoice');

  // Next invoice number generator
  const nextSerial = rentalRequests.length + 1030;
  const [docNumber, setDocNumber] = useState(`INV-${nextSerial}`);

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const dueDateStr = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const [docDate, setDocDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateStr);
  const [status, setStatus] = useState<'Pending' | 'Completed' | 'Partial' | 'Overdue'>('Pending');

  // Customer Information
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');

  // Items & Particulars
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: `item-${Date.now()}-1`,
      name: '',
      description: '',
      quantity: 1,
      rate: 0,
      taxRate: 18
    }
  ]);

  // Tax & Discount Adjustments
  const [taxMode, setTaxMode] = useState<'CGST_SGST' | 'IGST' | 'Exempt'>('CGST_SGST');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [applyRoundOff, setApplyRoundOff] = useState(true);

  // Notes & Signature
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'UPI' | 'Cheque'>('Bank Transfer');
  const [docNotes, setDocNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState(DEFAULT_TERMS);

  // UI state for Live Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle client selection auto-fill
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setCustomerName(client.name);
      setCompanyName(client.companyName);
      setGstin(client.gstNumber || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setBillingAddress(client.address || '');
      setState(client.state || 'Maharashtra');
      setPincode(client.pincode || '');
    }
  };

  // Document Type Change
  const handleDocTypeChange = (type: 'Invoice' | 'Voucher' | 'Receipt') => {
    setDocType(type);
    const prefix = type === 'Invoice' ? 'INV' : type === 'Voucher' ? 'VOU' : 'REC';
    setDocNumber(`${prefix}-${nextSerial}`);
  };

  // Item helpers
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length + 1}`,
        name: '',
        description: '',
        quantity: 1,
        rate: 0,
        taxRate: 18
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof ItemRow, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      toast.warning('An invoice requires at least one item.');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleDuplicateItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newItem: ItemRow = {
      ...item,
      id: `item-${Date.now()}-${items.length + 1}`
    };
    setItems([...items, newItem]);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setItems(newItems);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);

  const discountTotal = discountType === 'percentage'
    ? Math.round((subtotal * Number(discountValue || 0)) / 100)
    : Number(discountValue || 0);

  const taxableAmount = Math.max(0, subtotal - discountTotal);

  let taxTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  if (taxMode === 'CGST_SGST') {
    // 9% CGST + 9% SGST
    cgstTotal = Math.round(taxableAmount * 0.09);
    sgstTotal = Math.round(taxableAmount * 0.09);
    taxTotal = cgstTotal + sgstTotal;
  } else if (taxMode === 'IGST') {
    // 18% IGST
    igstTotal = Math.round(taxableAmount * 0.18);
    taxTotal = igstTotal;
  }

  const rawTotal = taxableAmount + taxTotal;
  const roundedGrandTotal = applyRoundOff ? Math.round(rawTotal) : rawTotal;
  const roundOffTotal = roundedGrandTotal - rawTotal;

  // Prepare Live Preview Object
  const previewData: InvoicePreviewData = {
    documentType: docType,
    invoiceNumber: docNumber,
    invoiceDate: docDate,
    dueDate,
    status,
    clientName: customerName,
    companyName,
    gstNumber: gstin,
    email,
    phone,
    billingAddress,
    state,
    pincode,
    shippingAddressSameAsBilling: shippingSameAsBilling,
    shippingAddress,
    shippingState,
    shippingPincode,
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      quantity: Number(i.quantity) || 1,
      rate: Number(i.rate) || 0,
      taxRate: Number(i.taxRate) || 18,
      amount: (Number(i.quantity) || 1) * (Number(i.rate) || 0)
    })),
    taxCalculationMode: taxMode,
    discountType,
    discountValue,
    applyRoundOff,
    paymentMethod,
    notes: docNotes,
    terms,
    subtotal,
    discountTotal,
    taxTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    roundOffTotal,
    grandTotal: roundedGrandTotal,
    amountPaid: status === 'Completed' ? roundedGrandTotal : 0
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!docNumber.trim()) {
      toast.error('Document Number is required');
      return;
    }
    if (items.some(i => !i.name.trim() || Number(i.rate) <= 0)) {
      toast.warning('Please enter valid product name and rate for all line items.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createInvoice({
        invoiceNumber: docNumber,
        rentalNumber: docNumber,
        clientName: customerName,
        companyName: companyName || customerName,
        gstNumber: gstin,
        email,
        phone,
        billingAddress,
        state,
        pincode,
        shippingAddressSameAsBilling: shippingSameAsBilling,
        shippingAddress,
        shippingState,
        shippingPincode,
        documentType: docType,
        invoiceDate: docDate,
        dueDate,
        status: 'Approved',
        grandTotal: roundedGrandTotal,
        amountPaid: status === 'Completed' ? roundedGrandTotal : 0,
        gstTotal: taxTotal,
        discountTotal,
        rentalChargesTotal: subtotal,
        paymentStatus: status,
        paymentMethod,
        taxCalculationMode: taxMode,
        discountType,
        discountValue,
        applyRoundOff,
        notes: docNotes,
        terms,
        items: items.map(i => ({
          equipmentId: i.id,
          equipmentName: i.name,
          quantity: Number(i.quantity) || 1,
          durationDays: 1,
          dailyCharges: Number(i.rate) || 0,
          discount: 0,
          securityDeposit: 0,
          taxes: Number(i.taxRate) || 0,
          subtotal: (Number(i.quantity) || 1) * (Number(i.rate) || 0),
          total: (Number(i.quantity) || 1) * (Number(i.rate) || 0),
          expectedReturnDate: dueDate,
          notes: i.description || ''
        }))
      });

      logActivity(
        user?.name || 'Admin',
        'admin',
        'Created Invoice',
        'create',
        `Created ${docType} ${docNumber} for ${customerName} totaling ₹${roundedGrandTotal.toLocaleString('en-IN')}`
      );

      toast.success(`${docType} ${docNumber} saved successfully!`);
      if (onInvoiceCreated) onInvoiceCreated(created);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Handler (downloads PDF and saves invoice)
  const handleDownload = async () => {
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!docNumber.trim()) {
      toast.error('Document Number is required');
      return;
    }
    if (items.some(i => !i.name.trim() || Number(i.rate) <= 0)) {
      toast.warning('Please enter valid product name and rate for all line items.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Download PDF
      generateAndDownloadInvoicePDF(previewData);

      // 2. Also save to ledger
      const created = await createInvoice({
        invoiceNumber: docNumber,
        rentalNumber: docNumber,
        clientName: customerName,
        companyName: companyName || customerName,
        gstNumber: gstin,
        email,
        phone,
        billingAddress,
        state,
        pincode,
        shippingAddressSameAsBilling: shippingSameAsBilling,
        shippingAddress,
        shippingState,
        shippingPincode,
        documentType: docType,
        invoiceDate: docDate,
        dueDate,
        status: 'Approved',
        grandTotal: roundedGrandTotal,
        amountPaid: status === 'Completed' ? roundedGrandTotal : 0,
        gstTotal: taxTotal,
        discountTotal,
        rentalChargesTotal: subtotal,
        paymentStatus: status,
        paymentMethod,
        taxCalculationMode: taxMode,
        discountType,
        discountValue,
        applyRoundOff,
        notes: docNotes,
        terms,
        items: items.map(i => ({
          equipmentId: i.id,
          equipmentName: i.name,
          quantity: Number(i.quantity) || 1,
          durationDays: 1,
          dailyCharges: Number(i.rate) || 0,
          discount: 0,
          securityDeposit: 0,
          taxes: Number(i.taxRate) || 0,
          subtotal: (Number(i.quantity) || 1) * (Number(i.rate) || 0),
          total: (Number(i.quantity) || 1) * (Number(i.rate) || 0),
          expectedReturnDate: dueDate,
          notes: i.description || ''
        }))
      });

      logActivity(
        user?.name || 'Admin',
        'admin',
        'Downloaded Invoice',
        'create',
        `Downloaded and saved ${docType} ${docNumber} for ${customerName} totaling ₹${roundedGrandTotal.toLocaleString('en-IN')}`
      );

      toast.success(`${docType} ${docNumber} downloaded and saved successfully!`);
      if (onInvoiceCreated) onInvoiceCreated(created);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download and save invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-brand-text">
              Create New Commercial Document
            </span>
          </div>
        }
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowPreviewModal(true)}
              leftIcon={<HiOutlineEye />}
              className="hidden sm:inline-flex text-xs"
            >
              Preview Document
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        }
        showCloseButton={false}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-left text-xs max-h-[80vh] overflow-y-auto pr-1">
          {/* Top Bar: Document Type Tabs & Preview Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
            {/* Document Type Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/50 rounded-xl w-fit">
              {(['Invoice', 'Voucher', 'Receipt'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleDocTypeChange(type)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    docType === type
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {type === 'Invoice' && <HiOutlineDocumentText className="h-4 w-4" />}
                  {type === 'Voucher' && <HiOutlineReceiptPercent className="h-4 w-4" />}
                  {type === 'Receipt' && <HiOutlineCreditCard className="h-4 w-4" />}
                  <span>{type}</span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowPreviewModal(true)}
              leftIcon={<HiOutlineEye />}
              className="sm:hidden w-full text-xs justify-center"
            >
              Preview Document
            </Button>
          </div>

          {/* Section 1: Document Meta Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Document Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl font-mono text-xs font-bold text-brand-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Document Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={docDate}
                onChange={e => setDocDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium text-brand-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium text-brand-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium bg-white text-brand-text focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Paid / Completed</option>
                <option value="Partial">Partially Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Section 2: CUSTOMER INFORMATION */}
          <div className="bg-white p-4.5 rounded-2xl border border-stone-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider">
                Customer Information
              </h3>
              {clients.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-medium">Quick Select:</span>
                  <select
                    value={selectedClientId}
                    onChange={e => handleClientSelect(e.target.value)}
                    className="text-[11px] py-1 px-2 border border-stone-200 rounded-lg bg-stone-50 font-medium text-brand-text focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe / TechCorp"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="TechCorp Solutions"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  placeholder="27ABCDE1234F1Z5"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl font-mono text-xs font-medium focus:outline-none focus:border-primary uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="client@techcorp.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  placeholder="Street address, Suite / Floor, Landmark"
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="400001"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Checkbox: Shipping address same as billing */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={shippingSameAsBilling}
                  onChange={e => setShippingSameAsBilling(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>Shipping address same as billing</span>
              </label>

              {!shippingSameAsBilling && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">Shipping Street Address</label>
                    <input
                      type="text"
                      placeholder="Site destination address"
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">Shipping State</label>
                    <input
                      type="text"
                      value={shippingState}
                      onChange={e => setShippingState(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">Shipping Pincode</label>
                    <input
                      type="text"
                      value={shippingPincode}
                      onChange={e => setShippingPincode(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Items & Particulars */}
          <div className="bg-white p-4.5 rounded-2xl border border-stone-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider">
                Items & Particulars
              </h3>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddItem}
                leftIcon={<HiOutlinePlus />}
                className="text-xs text-primary border-primary/30 hover:bg-blue-50"
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-stone-50/70 border border-stone-200/80 rounded-2xl space-y-3 transition-all hover:border-stone-300"
                  >
                    {/* Item Card Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-stone-700 tracking-wide">
                        ITEM #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <HiOutlineArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <HiOutlineArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(item.id)}
                          className="p-1 text-stone-400 hover:text-primary cursor-pointer"
                          title="Duplicate item"
                        >
                          <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                          title="Delete item"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Name & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Item Name (e.g. Caterpillar Excavator, Scaffolding, Cement)"
                          value={item.name}
                          onChange={e => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Description (Optional specifications, serial, site notes)"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-primary bg-white"
                        />
                      </div>
                    </div>

                    {/* Qty, Rate, Tax, Amount */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-bold text-brand-text bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Rate (INR)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.rate}
                          onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-bold text-brand-text bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Tax (%)</label>
                        <select
                          value={item.taxRate}
                          onChange={e => handleUpdateItem(item.id, 'taxRate', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs font-medium bg-white text-stone-700 cursor-pointer"
                        >
                          <option value="18">18% (Standard GST)</option>
                          <option value="12">12% (Goods Rate)</option>
                          <option value="5">5% (Concessional)</option>
                          <option value="28">28% (Luxury / Heavy)</option>
                          <option value="0">0% (Nil / Exempt)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Amount</label>
                        <div className="px-3 py-1.5 bg-stone-100/90 rounded-xl border border-stone-200 text-xs font-extrabold text-stone-900 text-right">
                          ₹{lineAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: TAX & DISCOUNT ADJUSTMENTS */}
          <div className="bg-white p-4.5 rounded-2xl border border-stone-200 space-y-3.5">
            <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-2">
              Tax & Discount Adjustments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Tax Calculation Mode
                </label>
                <select
                  value={taxMode}
                  onChange={e => setTaxMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium bg-white text-stone-800 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="CGST_SGST">CGST + SGST (Intra-state, 9% + 9%)</option>
                  <option value="IGST">IGST (Inter-state, 18%)</option>
                  <option value="Exempt">Exempt / Zero Tax</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium bg-white text-stone-800 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Checkbox: Apply automatic round off to grand total */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={applyRoundOff}
                  onChange={e => setApplyRoundOff(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>Apply automatic round off to grand total</span>
              </label>
            </div>
          </div>

          {/* Section 5: NOTES & AUTHORIZED SIGNATURE */}
          <div className="bg-white p-4.5 rounded-2xl border border-stone-200 space-y-3.5">
            <h3 className="font-extrabold text-xs text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-2">
              Notes & Authorized Signature
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-medium bg-white text-stone-800 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Document Notes
                </label>
                <input
                  type="text"
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="Thank you for your business!"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-700">Terms & Conditions</label>
                  <button
                    type="button"
                    onClick={() => setTerms(DEFAULT_TERMS)}
                    className="text-[10px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <HiOutlineArrowPath className="h-3 w-3" />
                    Reset to Company Default
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Authorized Signature Image
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-dashed border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <HiOutlinePhoto className="h-4 w-4 text-stone-400" />
                    Upload Signature Image
                  </button>
                  <span className="text-[10px] text-stone-400 italic">
                    (Default authorized digital signature and corporate stamp will be affixed)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Calculations Breakdown Summary Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-3 text-stone-600">
                <span>Subtotal: <strong className="text-stone-800">₹{subtotal.toLocaleString('en-IN')}</strong></span>
                {discountTotal > 0 && <span className="text-green-700">Discount: -₹{discountTotal.toLocaleString('en-IN')}</span>}
                <span>Tax: <strong className="text-stone-800">₹{taxTotal.toLocaleString('en-IN')}</strong></span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium">
                Tax mode: {taxMode === 'CGST_SGST' ? 'CGST (9%) + SGST (9%)' : taxMode === 'IGST' ? 'IGST (18%)' : 'Exempt'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Payable</span>
              <span className="text-xl font-black text-primary">₹{roundedGrandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Bottom Actions: Save and Download */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleDownload}
              leftIcon={<HiOutlineArrowDownTray />}
              disabled={isSubmitting}
            >
              Download
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Standalone Live Preview Modal */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Document Live Preview"
          size="xl"
        >
          <div className="space-y-4">
            <InvoiceDocumentPreview data={previewData} onClose={() => setShowPreviewModal(false)} />
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowPreviewModal(false)}>
                Back to Editor
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
