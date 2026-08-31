import * as XLSX from 'xlsx';
import { Lead, LeadFormData, LeadStatus, RoofType } from '../types';
import { LEAD_STATUSES, ROOF_TYPES } from './mockData';
import { formatDateTime } from './dateUtils';

// Get SheetJS instance (supporting both npm bundle and CDN window.XLSX)
const getXLSX = () => {
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    return (window as any).XLSX;
  }
  return XLSX;
};

export const SAMPLE_TEMPLATE_ROWS = [
  {
    'Responsible': 'Rahul Nair',
    'Customer Name': 'Anand Varma',
    'Mobile Number': '9847123456',
    'District': 'Ernakulam',
    'Sub-District': 'Aluva',
    'Address': 'Anand Nilayam, Desom Road',
    'Pincode': '683102',
    'Required KW': '5 kW',
    'Required Product': 'On-Grid',
    'Required Loan (Yes/No)': 'Yes',
    'Required Free Site Visit (Yes/No)': 'Yes',
    'Avg KSEB Bill (INR)': '6500 / Bi-monthly',
    'Roof Type': 'Concrete Flat',
    'Lead Status': 'Scheduled Site Survey',
    'Next Follow Up (DD-MM-YYYY hh:mm:ss AM/PM)': '05-09-2026 02:30:00 PM',
    'Site Survey Requested Date': '04-09-2026 10:00:00 AM',
    'Site Survey Completed Date': '',
    'Notes': 'Interested in 5kW On-Grid Rooftop solar under PM Surya Ghar scheme.',
    'Special Instructions': 'Check 3-phase sanction load.',
  },
  {
    'Responsible': 'Anjali Menon',
    'Customer Name': 'Mariam Thomas',
    'Mobile Number': '9447012345',
    'District': 'Kottayam',
    'Sub-District': 'Kanjirappally',
    'Address': 'Grace Villa, Church Hill',
    'Pincode': '686507',
    'Required KW': '3 kW',
    'Required Product': 'Hybrid',
    'Required Loan (Yes/No)': 'No',
    'Required Free Site Visit (Yes/No)': 'Yes',
    'Avg KSEB Bill (INR)': '3800 / Bi-monthly',
    'Roof Type': 'Sloped Tile',
    'Lead Status': 'Open',
    'Next Follow Up (DD-MM-YYYY hh:mm:ss AM/PM)': '',
    'Site Survey Requested Date': '',
    'Site Survey Completed Date': '',
    'Notes': 'Needs roof structural assessment for tile roof.',
    'Special Instructions': '',
  },
  {
    'Responsible': 'Arun Kumar',
    'Customer Name': 'Shaji Mohammed',
    'Mobile Number': '9745566778',
    'District': 'Kozhikode',
    'Sub-District': 'Kozhikode',
    'Address': 'Baitul Aman, Beach Road',
    'Pincode': '673001',
    'Required KW': '10 kW',
    'Required Product': 'On-Grid',
    'Required Loan (Yes/No)': 'Yes',
    'Required Free Site Visit (Yes/No)': 'No',
    'Avg KSEB Bill (INR)': '11200 / Monthly',
    'Roof Type': 'Truss Work',
    'Lead Status': 'Inprogress',
    'Next Follow Up (DD-MM-YYYY hh:mm:ss AM/PM)': '02-09-2026 11:00:00 AM',
    'Site Survey Requested Date': '01-09-2026 10:00:00 AM',
    'Site Survey Completed Date': '02-09-2026 09:30:00 AM',
    'Notes': 'Commercial consumer with high tariff.',
    'Special Instructions': 'Check 3-phase sanction load and structural safety on east side.',
  },
];

/**
 * Downloads a pre-formatted Excel template for importing solar leads
 */
export function downloadSampleTemplate(): void {
  const xlsx = getXLSX();
  const ws = xlsx.utils.json_to_sheet(SAMPLE_TEMPLATE_ROWS);

  // Set column widths for nice appearance
  ws['!cols'] = [
    { wch: 16 }, // Responsible
    { wch: 22 }, // Customer Name
    { wch: 16 }, // Mobile Number
    { wch: 16 }, // District
    { wch: 16 }, // Sub-District
    { wch: 28 }, // Address
    { wch: 10 }, // Pincode
    { wch: 16 }, // Required KW
    { wch: 18 }, // Required Product
    { wch: 22 }, // Required Loan
    { wch: 26 }, // Required Free Site Visit
    { wch: 18 }, // Avg KSEB Bill
    { wch: 16 }, // Roof Type
    { wch: 22 }, // Lead Status
    { wch: 38 }, // Next Follow Up
    { wch: 38 }, // Site Survey Requested Date
    { wch: 38 }, // Site Survey Completed Date
    { wch: 35 }, // Notes
    { wch: 35 }, // Special Instructions
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Leads Template');
  xlsx.writeFile(wb, 'Solar_CRM_Leads_Template.xlsx');
}

/**
 * Exports current leads to an Excel (.xlsx) file
 */
export function exportLeadsToExcel(leads: Lead[], filename = 'Solar_CRM_Leads_Export.xlsx'): void {
  const xlsx = getXLSX();
  
  const rows = leads.map((lead) => ({
    'Lead ID': lead.id,
    'Customer Name': lead.customer_name,
    'Mobile Number': lead.mobile_number,
    'Responsible': lead.responsible || 'Unassigned',
    'Lead Status': lead.lead_status,
    'District': lead.district,
    'Sub-District': lead.sub_district,
    'Address': lead.address,
    'Pincode': lead.pincode,
    'Required KW': lead.required_kw || '',
    'Required Product': lead.required_product || '',
    'Avg KSEB Bill': lead.avg_kseb_bill,
    'Roof Type': lead.roof_type,
    'Required Loan': lead.required_loan ? 'Yes' : 'No',
    'Required Free Site Visit': lead.required_free_site_visit ? 'Yes' : 'No',
    'Next Follow Up': lead.next_follow_up ? formatDateTime(lead.next_follow_up) : 'N/A',
    'Notes': lead.notes || '',
    'Special Instructions': lead.special_instructions || '',
    'Created At': formatDateTime(lead.created_at),
    'Last Modified At': formatDateTime(lead.updated_at || lead.created_at),
  }));

  const ws = xlsx.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 26 },
    { wch: 30 },
    { wch: 30 },
    { wch: 26 },
    { wch: 26 },
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Solar Leads');
  xlsx.writeFile(wb, filename);
}

/**
 * Exports daily activity reports to an Excel (.xlsx) file
 */
export function exportDailyReportsToExcel(reports: any[], filename = 'Solar_CRM_Daily_Reports.xlsx'): void {
  const xlsx = getXLSX();
  
  const rows = reports.map((report) => ({
    'Report ID': report.id,
    'Date': formatDateTime(report.created_at).split(' ')[0],
    'Time': formatDateTime(report.created_at).split(' ')[1] + ' ' + formatDateTime(report.created_at).split(' ')[2],
    'Sales Rep': report.sales_rep,
    'Activity Type': report.activity,
    'Lead Assigned': report.lead_assigned,
    'Customer Name': report.customer_name,
    'Location': report.location || '',
    'Phone Number': report.phone_number || '',
    'Status': report.status,
    'Advance Payment Status': report.advance_payment_status || '',
    'Remarks': report.remarks || '',
    'Manager Approval': report.manager_approval_status,
  }));

  const ws = xlsx.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 14 }, // Report ID
    { wch: 12 }, // Date
    { wch: 12 }, // Time
    { wch: 18 }, // Sales Rep
    { wch: 20 }, // Activity Type
    { wch: 15 }, // Lead Assigned
    { wch: 22 }, // Customer Name
    { wch: 20 }, // Location
    { wch: 15 }, // Phone Number
    { wch: 15 }, // Status
    { wch: 22 }, // Advance Payment Status
    { wch: 35 }, // Remarks
    { wch: 20 }, // Manager Approval
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Daily Reports');
  xlsx.writeFile(wb, filename);
}

export interface ParseResult {
  validLeads: LeadFormData[];
  invalidRows: { rowNumber: number; data: any; errors: string[] }[];
  totalRows: number;
}

/**
 * Parses and validates an uploaded Excel or CSV file
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const xlsx = getXLSX();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: 'array' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  const validLeads: LeadFormData[] = [];
  const invalidRows: { rowNumber: number; data: any; errors: string[] }[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const errors: string[] = [];

    // Helper to find column case-insensitively
    const getVal = (possibleKeys: string[]): string => {
      for (const key of possibleKeys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.trim().toLowerCase() === key.trim().toLowerCase()) {
            return String(row[rowKey]).trim();
          }
        }
      }
      return '';
    };

    const customerName = getVal(['Customer Name', 'customer_name', 'Name', 'Customer']);
    const mobileNumber = getVal(['Mobile Number', 'mobile_number', 'Mobile', 'Phone', 'Contact']);
    const responsible = getVal(['Responsible', 'responsible', 'Assigned To', 'Sales Rep']) || 'Unassigned';
    const district = getVal(['District', 'district']) || 'Ernakulam';
    const subDistrict = getVal(['Sub-District', 'sub_district', 'Sub District', 'Taluk']) || '';
    const address = getVal(['Address', 'address']) || '';
    const pincode = getVal(['Pincode', 'pincode', 'Pin Code', 'Zip']) || '';
    const requiredKw = getVal(['Required KW', 'required_kw', 'KW', 'Capacity', 'Required Capacity']) || '';
    const productRaw = getVal(['Required Product', 'required_product', 'Product', 'System Type']);
    let requiredProduct: any = undefined;
    if (productRaw) {
      if (productRaw.toLowerCase().includes('hybrid')) requiredProduct = 'Hybrid';
      else if (productRaw.toLowerCase().includes('grid')) requiredProduct = 'On-Grid';
      else requiredProduct = productRaw;
    }
    const notes = getVal(['Notes', 'notes', 'Remarks', 'Comments']) || '';
    const specialInstructions = getVal(['Special Instructions', 'special_instructions', 'Instructions', 'Special Instruction']) || '';
    
    // Parse boolean fields
    const loanRaw = getVal(['Required Loan (Yes/No)', 'Required Loan', 'required_loan', 'Loan']).toLowerCase();
    const requiredLoan = loanRaw === 'yes' || loanRaw === 'true' || loanRaw === '1' || loanRaw === 'y';

    const visitRaw = getVal(['Required Free Site Visit (Yes/No)', 'Required Free Site Visit', 'required_free_site_visit', 'Site Visit', 'Free Visit']).toLowerCase();
    const requiredFreeSiteVisit = visitRaw === 'yes' || visitRaw === 'true' || visitRaw === '1' || visitRaw === 'y';

    // Parse Bill
    const billRaw = getVal(['Avg KSEB Bill (INR)', 'Avg KSEB Bill', 'avg_kseb_bill', 'KSEB Bill', 'Bill']);
    const avgKsebBill = billRaw || '3500 / Bi-monthly';

    // Parse Roof Type
    const roofRaw = getVal(['Roof Type', 'roof_type', 'Roof']);
    const roofType = roofRaw || 'Concrete Flat';

    // Parse Lead Status
    const statusRaw = getVal(['Lead Status', 'lead_status', 'Status']);
    let leadStatus: LeadStatus = 'Open';
    const normalizedRaw = statusRaw.toLowerCase().replace(/interested/i, 'intrested').trim();
    const matchedStatus = LEAD_STATUSES.find(
      (s) => s.toLowerCase() === statusRaw.toLowerCase() || s.toLowerCase() === normalizedRaw
    );
    if (matchedStatus) {
      leadStatus = matchedStatus;
    } else if (statusRaw) {
      leadStatus = 'Open';
    }

    // Helper to parse DD-MM-YYYY format or standard date format
    const parseDateStr = (dateStr: string): string | null => {
      if (!dateStr || dateStr.trim() === '') return null;
      const match = dateStr.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        let hour = match[4] ? parseInt(match[4], 10) : 0;
        const minute = match[5] ? parseInt(match[5], 10) : 0;
        const ampm = match[7] ? match[7].toUpperCase() : null;
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        const parsedDate = new Date(year, month, day, hour, minute);
        if (!isNaN(parsedDate.getTime())) {
          const pad = (n: number) => (n < 10 ? '0' + n : n);
          return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
        }
      } else {
        const parsedDate = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
        if (!isNaN(parsedDate.getTime())) {
          const pad = (n: number) => (n < 10 ? '0' + n : n);
          return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
        }
      }
      return null;
    };

    // Parse Dates
    let followUp = parseDateStr(getVal(['Next Follow Up (DD-MM-YYYY hh:mm:ss AM/PM)', 'Next Follow Up (YYYY-MM-DD HH:MM)', 'Next Follow Up', 'next_follow_up', 'Follow Up', 'Followup Date'])) || '';
    const surveyReqDate = parseDateStr(getVal(['Site Survey Requested Date', 'site_survey_requested_date', 'Survey Requested', 'Site Survey Requested']));
    const surveyCompDate = parseDateStr(getVal(['Site Survey Completed Date', 'site_survey_completed_date', 'Survey Completed', 'Site Survey Completed']));

    // Validations
    if (!customerName) {
      errors.push('Customer Name is required');
    }
    if (!mobileNumber) {
      errors.push('Mobile Number is required');
    } else if (!/^[0-9+-\s()]{7,15}$/.test(mobileNumber)) {
      errors.push('Invalid Mobile Number format');
    }

    // Mandatory rules check
    if (leadStatus === 'Inprogress') {
      if (!followUp || followUp.trim() === '') {
        errors.push('Next Follow Up Date & Time is mandatory for Inprogress stage');
      }
      if (!notes || notes.trim() === '') {
        errors.push('Notes are mandatory for Inprogress stage');
      }
      if (!specialInstructions || specialInstructions.trim() === '') {
        errors.push('Special Instructions are mandatory for Inprogress stage');
      }
    } else if (leadStatus !== 'Open' && (!followUp || followUp.trim() === '')) {
      errors.push(`Next Follow Up Date & Time is mandatory for status "${leadStatus}"`);
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: rowNum, data: row, errors });
    } else {
      validLeads.push({
        customer_name: customerName,
        mobile_number: mobileNumber,
        responsible: responsible,
        district: district,
        sub_district: subDistrict,
        address: address,
        pincode: pincode,
        required_kw: requiredKw || undefined,
        required_product: requiredProduct || undefined,
        required_loan: requiredLoan,
        required_free_site_visit: requiredFreeSiteVisit,
        avg_kseb_bill: avgKsebBill,
        roof_type: roofType,
        lead_status: leadStatus,
        next_follow_up: followUp || null,
        site_survey_requested_date: surveyReqDate,
        site_survey_completed_date: surveyCompDate,
        notes: notes,
        special_instructions: specialInstructions,
      });
    }
  });

  return {
    validLeads,
    invalidRows,
    totalRows: rawRows.length,
  };
}
