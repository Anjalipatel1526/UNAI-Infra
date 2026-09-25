import type { Employee, Client, InventoryItem, RentalRequest, ActivityLog, SystemSettings } from '../types';

export const mockEmployees: Employee[] = [];

export const mockClients: Client[] = [];

export const mockInventory: InventoryItem[] = [];

export const mockRentalRequests: RentalRequest[] = [];

export const mockActivityLogs: ActivityLog[] = [];

export const defaultSystemSettings: SystemSettings = {
  companyName: 'UNAI Infra Civil Equipment Rental',
  gstNumber: '27AABCN8877K1Z4',
  invoicePrefix: 'INV-2026-',
  currency: 'INR',
  taxRate: 18,
  rentalRules: '1. Day rent charges are calculated for 24 hours.\n2. Security deposit is refundable within 7 working days after return verification.\n3. Late return penalty of 1.5x daily rent is applicable.\n4. Damaged equipment charges are based on actual service repair costs.',
  notificationSettings: {
    emailAlerts: true,
    smsAlerts: false,
    returnReminders: true,
    paymentReminders: true
  },
  backupInterval: 'weekly',
  lastBackupDate: '2026-07-05'
};
