import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-toastify';
import {
  HiOutlineServer,
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray
} from 'react-icons/hi2';

export const Settings: React.FC = () => {
  const { settings, updateSettings, logActivity } = useData();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [rentalRules, setRentalRules] = useState(settings.rentalRules);
  const [emailAlerts, setEmailAlerts] = useState(settings.notificationSettings.emailAlerts);
  const [smsAlerts, setSmsAlerts] = useState(settings.notificationSettings.smsAlerts);
  const [returnReminders, setReturnReminders] = useState(settings.notificationSettings.returnReminders);
  const paymentReminders = settings.notificationSettings.paymentReminders;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      gstNumber,
      invoicePrefix,
      currency: 'INR',
      taxRate: Number(taxRate),
      rentalRules,
      notificationSettings: {
        emailAlerts,
        smsAlerts,
        returnReminders,
        paymentReminders
      },
      backupInterval: 'weekly',
      lastBackupDate: new Date().toISOString().split('T')[0]
    });

    logActivity(
      user?.name || 'Admin',
      'admin',
      'Updated System Settings',
      'system',
      `Modified corporate profile parameters, tax configurations, and notification controls.`
    );

    toast.success('System configurations saved successfully');
  };

  // Full Database Backup
  const handleBackup = () => {
    toast.info('Compiling database tables...');
    const backupData: Record<string, string | null> = {
      nh_homes_db_v2_employees: localStorage.getItem('nh_homes_db_v2_employees'),
      nh_homes_db_v2_clients: localStorage.getItem('nh_homes_db_v2_clients'),
      nh_homes_db_v2_inventory: localStorage.getItem('nh_homes_db_v2_inventory'),
      nh_homes_db_v2_rentals: localStorage.getItem('nh_homes_db_v2_rentals'),
      nh_homes_db_v2_logs: localStorage.getItem('nh_homes_db_v2_logs'),
      nh_homes_db_v2_settings: localStorage.getItem('nh_homes_db_v2_settings')
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `UNAI_Infra_DB_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    
    logActivity(user?.name || 'Admin', 'admin', 'Triggered System Backup', 'system', 'Downloaded complete system registry JSON backup.');
    toast.success('Database backup downloaded successfully!');
  };

  // Database Restore
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        Object.keys(parsed).forEach(key => {
          if (parsed[key]) {
            // Backward compatibility: map old keys (nh_ or nh_homes_) to v2 namespaces
            let targetKey = key;
            if (!key.startsWith('nh_homes_db_v2_')) {
              if (key.startsWith('nh_homes_')) {
                targetKey = key.replace('nh_homes_', 'nh_homes_db_v2_');
              } else if (key.startsWith('nh_')) {
                targetKey = key.replace('nh_', 'nh_homes_db_v2_');
              }
            }
            localStorage.setItem(targetKey, parsed[key]);
          }
        });
        
        logActivity(user?.name || 'Admin', 'admin', 'Restored Database', 'system', 'Restored complete database state from backup file.');
        toast.success('Database state restored! Reloading application...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        toast.error('Failed to parse database backup file. Invalid format.');
      }
    };
    fileReader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-extrabold text-brand-text tracking-tight m-0">System Control Center</h1>
        <p className="text-xs text-brand-dark-grey mt-0.5">Manage tax parameters, terms, automated alerts, and database backups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Settings Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          {/* Company Details */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Company Identity & GST</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Registered Entity Name *" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                <Input label="Corporate GSTIN ID *" required value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Invoice Number Prefix *" required placeholder="INV-2026-" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} />
                <Input label="Standard GST Rate (%) *" type="number" required placeholder="18" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
              </div>
            </CardBody>
          </Card>

          {/* Rules & Terms */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Default Rental Terms & Rules</h3>
            </CardHeader>
            <CardBody>
              <Textarea
                label="Standard Invoice Footer Terms"
                rows={5}
                value={rentalRules}
                onChange={e => setRentalRules(e.target.value)}
              />
            </CardBody>
          </Card>

          {/* Notifications config */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Notification Alert Configs</h3>
            </CardHeader>
            <CardBody className="space-y-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={e => setEmailAlerts(e.target.checked)}
                  className="rounded border-brand-border text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <div>
                  <span className="font-semibold text-brand-text block">Send automated billing invoice emails</span>
                  <span className="text-[10px] text-brand-dark-grey mt-0.5 block">Dispatches receipts immediately upon admin approvals.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={e => setSmsAlerts(e.target.checked)}
                  className="rounded border-brand-border text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <div>
                  <span className="font-semibold text-brand-text block">Send SMS text reminders</span>
                  <span className="text-[10px] text-brand-dark-grey mt-0.5 block">Dispatches SMS alerts for dispatched deliveries.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnReminders}
                  onChange={e => setReturnReminders(e.target.checked)}
                  className="rounded border-brand-border text-primary focus:ring-primary h-4.5 w-4.5"
                />
                <div>
                  <span className="font-semibold text-brand-text block">Overdue return email reminders</span>
                  <span className="text-[10px] text-brand-dark-grey mt-0.5 block">Auto-notifies clients 2 days before return dates.</span>
                </div>
              </label>
            </CardBody>
          </Card>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="lg" type="submit">
              Save Configuration Settings
            </Button>
          </div>
        </form>

        {/* Right Side: Backups panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <HiOutlineServer className="h-5 w-5 text-brand-dark-grey" />
              <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Database Backups</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-[11px] text-brand-dark-grey leading-relaxed">
                Download a complete backup of all database tables (Clients, Inventory, Rentals, and Settings) as a JSON file, or restore tables from a past backup.
              </p>
              
              <div className="bg-brand-light-grey p-3 rounded-xl border border-brand-border space-y-1 block">
                <span className="text-[10px] text-brand-dark-grey block">Last backup scheduled:</span>
                <span className="font-bold text-brand-text block">{settings.lastBackupDate}</span>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={handleBackup} leftIcon={<HiOutlineArrowDownTray />}>
                  Download Backup File
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleRestore}
                  accept=".json"
                  className="hidden"
                />
                
                <Button variant="secondary" size="sm" className="w-full" onClick={triggerFileInput} leftIcon={<HiOutlineArrowUpTray />}>
                  Upload & Restore State
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Settings;
