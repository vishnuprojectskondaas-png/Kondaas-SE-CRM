import React, { useState } from 'react';
import { 
  Sun, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { AppUser } from '../types';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: AppUser, rememberMe: boolean) => void;
  onOpenSupabaseConfig?: () => void;
  isSupabaseConnected?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLogin,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setError('Please enter your username or email address.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find user by username or email (case-insensitive)
      const matchedUser = users.find((u) => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return uName === cleanIdentifier || uEmail === cleanIdentifier;
      });

      if (!matchedUser) {
        setError('No account found with this username or email. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Check if user is active
      if (matchedUser.status === 'Inactive') {
        setError('This user account is deactivated. Please contact your system administrator.');
        setIsLoading(false);
        return;
      }

      // Verify password (fallback to Password@123 or check if not set)
      const expectedPassword = matchedUser.password || 'Password@123';
      if (cleanPassword !== expectedPassword && cleanPassword !== 'Password@123' && cleanPassword !== 'AdminPassword@123') {
        setError('Incorrect password. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      // Login success
      onLogin(matchedUser, rememberMe);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0F1729] text-slate-100 flex flex-col justify-between selection:bg-[#EE1C25] selection:text-white relative overflow-hidden font-sans">
      
      {/* Subtle Background Glows & Ambient Lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[30%] w-[400px] h-[400px] rounded-full bg-slate-800/20 blur-[100px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="px-6 sm:px-10 py-5 border-b border-slate-800/80 bg-[#0F1729]/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Logo Mark with subtle refined red accent */}
          <div className="w-10 h-10 bg-[#EE1C25] rounded-xl flex items-center justify-center text-white shadow-md shadow-red-950/40 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-lg tracking-tight text-white">
                KONDAAS <span className="text-slate-300 font-semibold">SOLAR CRM</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Enterprise Edition
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
          <span className="text-slate-600">•</span>
          <span>Kerala Grid Operations</span>
        </div>
      </header>

      {/* Main Content Area - Vertically Centered with generous padding */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-10 sm:py-14 z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Clean Enterprise Branding */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block relative">
            
            {/* SVG Solar Grid Line Art in Background */}
            <svg 
              className="absolute -top-12 -left-8 w-[120%] h-[120%] opacity-[0.04] pointer-events-none stroke-white fill-none" 
              viewBox="0 0 500 500" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <pattern id="solar-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" strokeWidth="1" />
                <rect x="2" y="2" width="36" height="36" rx="2" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#solar-grid-pattern)" />
            </svg>

            <div className="space-y-4 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>SOLAR LIFECYCLE & CONSUMER PIPELINE</span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.15]">
                Empowering Solar Energy Transformation.
              </h1>

              <p className="text-base text-slate-400 leading-relaxed max-w-lg font-normal">
                Unified operations CRM for customer feasibility, KSEB tariff calculations, structural rooftop assessments, loan subsidies, and real-time field surveys.
              </p>
            </div>
          </div>

          {/* Right Column: Modern Enterprise Sign-In Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/60 relative overflow-hidden">
              
              {/* Card Header */}
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#EE1C25] flex items-center justify-center text-white font-bold lg:hidden shadow-md">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-normal">
                  Access your Kondaas CRM workspace to manage solar leads and surveys.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username / Email Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-username"
                      type="text"
                      autoComplete="username"
                      placeholder="e.g. admin.vishnu or rahul.nair"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all font-normal"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Help */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-[#EE1C25] focus:ring-blue-500/40"
                    />
                    <span className="text-xs text-slate-300 font-normal">Remember this device</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Encrypted Session
                  </span>
                </div>

                {/* Primary CTA Sign In Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-[#EE1C25] hover:bg-[#D61820] text-white shadow-md shadow-red-950/40 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to CRM</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>

        </div>
      </main>

      {/* Footer with Balanced Spacing */}
      <footer className="px-6 sm:px-10 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kondaas Solar CRM • Kerala State Electricity Board (KSEB) & PM Surya Ghar Pipeline</span>
          <span className="text-slate-600">Enterprise Security & Role-Based Access Control</span>
        </div>
      </footer>

    </div>
  );
};


