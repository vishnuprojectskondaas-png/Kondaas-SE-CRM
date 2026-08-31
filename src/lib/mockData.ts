import { Lead, AppUser, UserRole, UserPermissions } from '../types';

export const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

export const SUB_DISTRICTS_MAP: Record<string, string[]> = {
  Ernakulam: ['Aluva', 'Kanayannur', 'Kochi', 'Kothamangalam', 'Kunnathunad', 'Muvattupuzha', 'Paravur'],
  Thiruvananthapuram: ['Chirayinkeezhu', 'Nedumangad', 'Neyyattinkara', 'Thiruvananthapuram', 'Varkala', 'Kattakada'],
  Kozhikode: ['Kozhikode', 'Koyilandy', 'Vadakara', 'Thamarassery'],
  Thrissur: ['Chalakudy', 'Chavakkad', 'Kodungallur', 'Mukundapuram', 'Talappilly', 'Thrissur'],
  Kollam: ['Kollam', 'Karunagappally', 'Kunnathur', 'Kottarakkara', 'Punalur', 'Pathanapuram'],
  Palakkad: ['Alathur', 'Chittur', 'Mannarkkad', 'Ottappalam', 'Palakkad', 'Pattambi'],
  Malappuram: ['Ernad', 'Nilambur', 'Perinthalmanna', 'Tirur', 'Tirurangadi', 'Ponnani', 'Kondotty'],
  Kannur: ['Kannur', 'Thalassery', 'Taliparamba', 'Iritty', 'Payyannur'],
  Kottayam: ['Changanassery', 'Kanjirappally', 'Kottayam', 'Meenachil', 'Vaikom'],
  Alappuzha: ['Ambalapuzha', 'Chengannur', 'Cherthala', 'Karthikappally', 'Kuttanad', 'Mavelikkara'],
  Idukki: ['Devikulam', 'Peerumade', 'Thodupuzha', 'Udumbanchola', 'Idukki'],
  Pathanamthitta: ['Adoor', 'Konni', 'Kozhencherry', 'Mallappally', 'Ranni', 'Thiruvalla'],
  Kasaragod: ['Hosdurg', 'Kasaragod', 'Manjeshwaram', 'Vellarikundu'],
  Wayanad: ['Mananthavady', 'Sultan Bathery', 'Vythiri'],
};

export const ROOF_TYPES = [
  'Concrete Flat',
  'Sloped Tile',
  'Metal Sheet',
  'Truss Work',
  'Other',
] as const;

export const REQUIRED_PRODUCT_OPTIONS = [
  'On-Grid',
  'Hybrid',
] as const;

export const LEAD_STATUSES = [
  'Open',
  'Inprogress',
  'No Response',
  'Busy Callback',
  'Scheduled Site Survey',
  'Site Survey Completed',
  'Order Confirmed',
  'Not Intrested',
  'Lost',
] as const;

export const USER_ROLES: UserRole[] = [
  'Sales Representative',
  'Survey Engineer',
  'Branch Manager',
  'Telecaller',
  'Admin',
];

export const SALES_REPS = [
  'Rahul Nair',
  'Anjali Menon',
  'Arun Kumar',
  'Deepa Varma',
  'Sandeep Pillai',
  'Fathima Beevi',
];

export const getDefaultPermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'Admin':
      return {
        canAddLead: true,
        canEditContactDetails: true,
        canDeleteLead: true,
        canAccessExcel: true,
        canManageUsers: true,
        canManageDatabase: true,
        accessAssignedLeadsOnly: false,
      };
    case 'Branch Manager':
      return {
        canAddLead: true,
        canEditContactDetails: true,
        canDeleteLead: true,
        canAccessExcel: false,
        canManageUsers: false,
        canManageDatabase: false,
        accessAssignedLeadsOnly: false,
      };
    case 'Sales Representative':
      return {
        canAddLead: true,
        canEditContactDetails: true,
        canDeleteLead: false,
        canAccessExcel: false,
        canManageUsers: false,
        canManageDatabase: false,
        accessAssignedLeadsOnly: true,
      };
    case 'Telecaller':
      return {
        canAddLead: true,
        canEditContactDetails: true,
        canDeleteLead: false,
        canAccessExcel: false,
        canManageUsers: false,
        canManageDatabase: false,
        accessAssignedLeadsOnly: false,
      };
    case 'Survey Engineer':
      return {
        canAddLead: false,
        canEditContactDetails: false,
        canDeleteLead: false,
        canAccessExcel: false,
        canManageUsers: false,
        canManageDatabase: false,
        accessAssignedLeadsOnly: true,
      };
    default:
      return {
        canAddLead: true,
        canEditContactDetails: true,
        canDeleteLead: false,
        canAccessExcel: false,
        canManageUsers: false,
        canManageDatabase: false,
        accessAssignedLeadsOnly: false,
      };
  }
};

export const INITIAL_USERS: AppUser[] = [
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
];


// Helper to get formatted local dates
const now = new Date();
const formatDate = (offsetDays: number, hour = 11, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  // Returns format YYYY-MM-DDTHH:mm for datetime-local
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`;
};

export const INITIAL_LEADS: Lead[] = [];

export const ACTIVITY_TYPES = [
  'Site Survey',
  'Cold Calling',
  'KSEB AF Payment',
  'KSEB RF payment',
  'KSEB Doccuments submission',
  'Other',
] as const;

export const LEAD_ASSIGNED_TYPES = [
  'Office',
  'Own',
] as const;

export const ACTIVITY_STATUSES = [
  'Completed',
  'Pending',
  'Cancelled',
  'Planned',
  'Started',
] as const;

export const APPROVAL_STATUSES = [
  'Approved',
  'Not Approved',
] as const;

export const INITIAL_DAILY_REPORTS: any[] = [];

