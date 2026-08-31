import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  AtSign,
  KeyRound
} from 'lucide-react';
import { AppUser, UserFormData, UserRole, UserPermissions } from '../types';
import { KERALA_DISTRICTS, USER_ROLES, getDefaultPermissions } from '../lib/mockData';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserFormData, userId?: string) => Promise<void>;
  initialUser?: AppUser | null;
}

const COLOR_OPTIONS = [
  { name: 'Blue', value: 'bg-blue-600', text: 'text-blue-600' },
  { name: 'Emerald', value: 'bg-emerald-600', text: 'text-emerald-600' },
  { name: 'Indigo', value: 'bg-indigo-600', text: 'text-indigo-600' },
  { name: 'Purple', value: 'bg-purple-600', text: 'text-purple-600' },
  { name: 'Amber', value: 'bg-amber-600', text: 'text-amber-600' },
  { name: 'Rose', value: 'bg-rose-600', text: 'text-rose-600' },
  { name: 'Teal', value: 'bg-teal-600', text: 'text-teal-600' },
  { name: 'Slate', value: 'bg-slate-800', text: 'text-slate-800' },
];

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUser,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    username: '',
    password: '',
    email: '',
    mobile_number: '',
    role: 'Sales Representative',
    district: 'Ernakulam',
    status: 'Active',
    avatar_color: 'bg-blue-600',
    permissions: getDefaultPermissions('Sales Representative'),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setFormData({
        name: initialUser.name || '',
        username: initialUser.username || '',
        password: initialUser.password || '',
        email: initialUser.email || '',
        mobile_number: initialUser.mobile_number || '',
        role: initialUser.role || 'Sales Representative',
        district: initialUser.district || 'Ernakulam',
        status: initialUser.status || 'Active',
        avatar_color: initialUser.avatar_color || 'bg-blue-600',
        permissions: initialUser.permissions || getDefaultPermissions(initialUser.role || 'Sales Representative'),
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        email: '',
        mobile_number: '',
        role: 'Sales Representative',
        district: 'Ernakulam',
        status: 'Active',
        avatar_color: 'bg-blue-600',
        permissions: getDefaultPermissions('Sales Representative'),
      });
    }
    setShowPassword(false);
    setErrors({});
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setFormData({
      ...formData,
      role: newRole,
      permissions: getDefaultPermissions(newRole),
    });
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
    const currentPerms = formData.permissions || getDefaultPermissions(formData.role);
    setFormData({
      ...formData,
      permissions: {
        ...currentPerms,
        [key]: !currentPerms[key],
      },
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.mobile_number.trim()) {
      errs.mobile_number = 'Mobile number is required';
    } else if (!/^[0-9+-\s()]{7,15}$/.test(formData.mobile_number.trim())) {
      errs.mobile_number = 'Please enter a valid mobile number (e.g. 9847112233)';
    }

    if (formData.username && formData.username.trim().length < 3) {
      errs.username = 'Username should be at least 3 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Auto-generate username from name/email if empty
      const payload: UserFormData = {
        ...formData,
        username: formData.username?.trim() || formData.name.toLowerCase().replace(/\s+/g, '.'),
        password: formData.password?.trim() || 'Solar@123',
      };
      await onSubmit(payload, initialUser ? initialUser.id : undefined);
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to save user. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = formData.name
    ? formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#BBD5DA] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-5 flex items-center justify-between border-b border-[#BBD5DA]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF0000] text-white flex items-center justify-center font-bold shadow-xs text-sm">
              {initials}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialUser ? 'Edit Team Member / User' : 'Create New User / Sales Rep'}
              </h2>
              <p className="text-xs text-[#BBD5DA]">
                {initialUser ? `Editing ${initialUser.name}` : 'Add sales reps, survey engineers, or branch managers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {errors.form && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="input-user-name"
                type="text"
                placeholder="e.g. Rahul Nair"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm border bg-slate-50/50 focus:bg-white transition-all ${
                  errors.name ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Username & Password (Credentials) */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Login Credentials & Account Access</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="input-user-username"
                    type="text"
                    placeholder="e.g. rahul.nair"
                    value={formData.username || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border border-slate-300 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="input-user-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                    }}
                    className="w-full pl-8 pr-9 py-2 rounded-lg text-xs border border-slate-300 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Users can log in with their username/email and password to view their assigned leads.
            </p>
          </div>

          {/* Email & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-user-email"
                  type="email"
                  placeholder="name@kondaas.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border bg-slate-50/50 focus:bg-white transition-all ${
                    errors.email ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="input-user-mobile"
                  type="tel"
                  placeholder="+91 98471 12233"
                  value={formData.mobile_number}
                  onChange={(e) => {
                    setFormData({ ...formData, mobile_number: e.target.value });
                    if (errors.mobile_number) setErrors({ ...errors, mobile_number: '' });
                  }}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border bg-slate-50/50 focus:bg-white transition-all ${
                    errors.mobile_number ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
              </div>
              {errors.mobile_number && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.mobile_number}</p>
              )}
            </div>
          </div>

          {/* Role & Territory / District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role / Designation <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  id="select-user-role"
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Territory / District */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Territory
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  id="select-user-district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="All Kerala">All Kerala (State-wide)</option>
                  {KERALA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* User Access Permissions */}
          <div className="p-3.5 rounded-lg bg-blue-50/40 border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Feature Access & Permissions</span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">
                {formData.role} Defaults
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Customize what this user is authorized to view and execute inside the Solar CRM.
            </p>

            <div className="space-y-2 pt-1">
              {/* Permission: Access Assigned Leads only */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-access-assigned-leads-only"
                  type="checkbox"
                  checked={formData.permissions?.accessAssignedLeadsOnly ?? false}
                  onChange={() => handlePermissionToggle('accessAssignedLeadsOnly')}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Access Assigned Leads only</span>
                  <p className="text-[11px] text-slate-500">
                    Restricts this user to only see and manage leads assigned to their name (Responsible), hiding other executives' leads.
                  </p>
                </div>
              </label>

              {/* Permission: Add Lead */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-add-lead"
                  type="checkbox"
                  checked={formData.permissions?.canAddLead ?? true}
                  onChange={() => handlePermissionToggle('canAddLead')}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Add Lead</span>
                  <p className="text-[11px] text-slate-500">
                    Allows creating new solar leads and saving customer inquiries.
                  </p>
                </div>
              </label>

              {/* Permission: Edit Customer Contact details */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-edit-contact"
                  type="checkbox"
                  checked={formData.permissions?.canEditContactDetails ?? true}
                  onChange={() => handlePermissionToggle('canEditContactDetails')}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Edit Customer Contact Details</span>
                  <p className="text-[11px] text-slate-500">
                    Allows modifying customer name, mobile number, district, address, and pincode.
                  </p>
                </div>
              </label>

              {/* Permission: Delete lead */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-delete-lead"
                  type="checkbox"
                  checked={formData.permissions?.canDeleteLead ?? false}
                  onChange={() => handlePermissionToggle('canDeleteLead')}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Delete Lead</span>
                  <p className="text-[11px] text-slate-500">
                    Allows permanently deleting leads from the pipeline.
                  </p>
                </div>
              </label>

              {/* Permission: Excel (Import/Export) */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-access-excel"
                  type="checkbox"
                  checked={formData.permissions?.canAccessExcel ?? false}
                  onChange={() => handlePermissionToggle('canAccessExcel')}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Excel Import & Export Access</span>
                  <p className="text-[11px] text-slate-500">
                    Shows Excel export, bulk template download, and spreadsheet upload actions.
                  </p>
                </div>
              </label>

              {/* Permission: Team & Users */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-manage-users"
                  type="checkbox"
                  checked={formData.permissions?.canManageUsers ?? false}
                  onChange={() => handlePermissionToggle('canManageUsers')}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Team & User Directory Access</span>
                  <p className="text-[11px] text-slate-500">
                    Shows the Team & Users tab and allows creating, editing, and managing user accounts.
                  </p>
                </div>
              </label>

              {/* Permission: Cloud DB Settings */}
              <label className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  id="perm-manage-database"
                  type="checkbox"
                  checked={formData.permissions?.canManageDatabase ?? false}
                  onChange={() => handlePermissionToggle('canManageDatabase')}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Supabase & Database Configuration Access</span>
                  <p className="text-[11px] text-slate-500">
                    Allows viewing, testing, and modifying live Supabase credentials and database schema. (Restricted to Admins by default)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Account Status</span>
              <p className="text-[11px] text-slate-500">
                {formData.status === 'Active' ? 'Active — can be assigned leads and surveys' : 'Inactive — hidden from active assignment'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'Active' })}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  formData.status === 'Active'
                    ? 'bg-green-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  formData.status === 'Inactive'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Avatar Color Theme */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Badge & Avatar Theme
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = (formData.avatar_color || 'bg-blue-600') === c.value;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_color: c.value })}
                    className={`w-7 h-7 rounded-full ${c.value} flex items-center justify-center text-white transition-transform ${
                      isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#BBD5DA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-user"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? 'Saving...' : initialUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
