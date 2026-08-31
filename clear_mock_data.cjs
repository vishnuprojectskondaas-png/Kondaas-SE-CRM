const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/mockData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace INITIAL_USERS
content = content.replace(/export const INITIAL_USERS: AppUser\[\] = \[[\s\S]*?\];/m, `export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-7',
    name: 'Vishnu Kondaas',
    username: 'admin.vishnu',
    password: 'AdminPassword@123',
    email: 'vishnu.kondaas@gmail.com',
    mobile_number: '+919847000001',
    role: 'Admin',
    district: 'All Kerala',
    status: 'Active',
    avatar_color: 'bg-slate-900',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    permissions: getDefaultPermissions('Admin'),
  },
];`);

// Replace INITIAL_LEADS
content = content.replace(/export const INITIAL_LEADS: Lead\[\] = \[[\s\S]*?\];/m, `export const INITIAL_LEADS: Lead[] = [];`);

// Replace INITIAL_DAILY_REPORTS
content = content.replace(/export const INITIAL_DAILY_REPORTS: any\[\] = \[[\s\S]*?\];/m, `export const INITIAL_DAILY_REPORTS: any[] = [];`);

fs.writeFileSync(filePath, content);
console.log('Mock data cleared.');
