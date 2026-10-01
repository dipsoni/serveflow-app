import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { superAdminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your admin email and password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await superAdminLogin(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/super-admin/dashboard');
    } else {
      setError(res.message || 'Invalid administrator credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f6] flex flex-col justify-center items-center p-4 font-sans text-slate-800">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Super Admin Console
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">ServeFlow Platform Governance</p>
      </div>

      {/* Main Admin Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-slate-200/70 p-8 sm:p-9">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex items-center bg-[#eef3f8] border border-transparent focus-within:border-slate-300 rounded-lg px-3 py-2.5 transition-all">
            <Mail className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              autoComplete="email"
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-[#eef3f8] border border-transparent focus-within:border-slate-300 rounded-lg px-3 py-2.5 transition-all">
            <Lock className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Master Password"
              autoComplete="current-password"
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium ml-2 shrink-0 cursor-pointer select-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Solid Black Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1c1c1c] hover:bg-black text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? 'Authenticating...' : 'Sign In as Platform Owner'}
          </button>
        </form>
      </div>

      {/* Return link */}
      <div className="mt-8 text-xs text-slate-500">
        <Link to="/login" className="hover:text-slate-800 transition-colors">
          ← Return to Restaurant Login
        </Link>
      </div>
    </div>
  );
}
