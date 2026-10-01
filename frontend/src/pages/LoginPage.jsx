import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Lock, Mail, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password / Email Link Modal States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [emailLinkModalOpen, setEmailLinkModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      showToast('Please enter both your email and password.', 'warning');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user?.name || 'User'}!`, 'success');
      navigate('/dashboard');
    } else {
      showToast(result.message || 'Invalid email or password.', 'error');
    }
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!modalEmail) return;
    setModalLoading(true);
    // Simulate real reset token dispatch
    await new Promise((res) => setTimeout(res, 800));
    setModalLoading(false);
    setModalSuccessMsg(`A password reset link has been sent to ${modalEmail}`);
    setTimeout(() => {
      setForgotModalOpen(false);
      setModalSuccessMsg('');
      setModalEmail('');
    }, 2500);
  };

  const handleSendEmailLink = async (e) => {
    e.preventDefault();
    if (!modalEmail) return;
    setModalLoading(true);
    // Simulate magic link dispatch
    await new Promise((res) => setTimeout(res, 800));
    setModalLoading(false);
    setModalSuccessMsg(`A secure login link has been sent to ${modalEmail}. Check your inbox.`);
    setTimeout(() => {
      setEmailLinkModalOpen(false);
      setModalSuccessMsg('');
      setModalEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md mb-3">
          <Flame className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Login to ServeFlow
        </h1>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-slate-200/70 p-8 sm:p-9">
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="flex items-center bg-[#eef3f8] border border-transparent focus-within:border-slate-300 rounded-lg px-3 py-2.5 transition-all">
            <Mail className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center bg-[#eef3f8] border border-transparent focus-within:border-slate-300 rounded-lg px-3 py-2.5 transition-all">
            <Lock className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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

          {/* Forgot Password Link */}
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => {
                setModalEmail(email);
                setModalSuccessMsg('');
                setForgotModalOpen(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-900 font-normal transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Solid Black Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1c1c1c] hover:bg-black text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 text-center">
          <span className="text-xs text-slate-400">or</span>
        </div>

        {/* Secondary Login with Email Link Button */}
        <button
          type="button"
          onClick={() => {
            setModalEmail(email);
            setModalSuccessMsg('');
            setEmailLinkModalOpen(true);
          }}
          className="w-full py-2.5 bg-[#f0f2f5] hover:bg-slate-200/80 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Login with Email Link
        </button>

        {/* 1-Click Multi-Tab Testing Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Multi-Tab Test Accounts</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">Tab-Isolated</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Open 3 tabs at <code className="text-orange-600 bg-orange-50 px-1 py-0.5 rounded font-mono text-[10px]">localhost:5000/login</code> and click a different role in each tab:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setEmail('owner@serveflow.com');
                setPassword('password123');
                setLoading(true);
                const res = await login('owner@serveflow.com', 'password123');
                setLoading(false);
                if (res.success) {
                  showToast('Logged in as OWNER (Tables & Orders)', 'success');
                  navigate('/dashboard');
                }
              }}
              className="p-2.5 text-center rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="text-lg mb-1">👑</div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Admin</div>
              <div className="text-[9px] text-slate-400">Dashboard / Tables</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setEmail('kitchen@serveflow.com');
                setPassword('password123');
                setLoading(true);
                const res = await login('kitchen@serveflow.com', 'password123');
                setLoading(false);
                if (res.success) {
                  showToast('Logged in as KITCHEN (KOT Screen)', 'success');
                  navigate('/kot');
                }
              }}
              className="p-2.5 text-center rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="text-lg mb-1">🍳</div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Kitchen</div>
              <div className="text-[9px] text-slate-400">Live KOT Display</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setEmail('cashier@serveflow.com');
                setPassword('password123');
                setLoading(true);
                const res = await login('cashier@serveflow.com', 'password123');
                setLoading(false);
                if (res.success) {
                  showToast('Logged in as CASHIER (POS Billing)', 'success');
                  navigate('/pos');
                }
              }}
              className="p-2.5 text-center rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="text-lg mb-1">💵</div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Cashier</div>
              <div className="text-[9px] text-slate-400">POS Billing Counter</div>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Link to Public Website */}
      <div className="mt-8 text-xs text-slate-500 flex items-center gap-3">
        <Link to="/" className="hover:text-slate-800 transition-colors">
          Home
        </Link>
        <span>•</span>
        <Link to="/register" className="hover:text-slate-800 transition-colors">
          Create Restaurant
        </Link>
        <span>•</span>
        <Link to="/admin/login" className="hover:text-slate-800 transition-colors">
          Super Admin
        </Link>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>

            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{modalSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-3">
                <div className="flex items-center bg-[#eef3f8] border border-transparent focus-within:border-slate-300 rounded-lg px-3 py-2">
                  <Mail className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {modalLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Login with Email Link Modal */}
      {emailLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <button
              onClick={() => setEmailLinkModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Login with Email Link</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your email and we'll send you an instant one-click login link. No password required.
            </p>

            {modalSuccessMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{modalSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendEmailLink} className="space-y-3">
                <div className="flex items-center bg-[#eef3f8] border border-transparent focus-within:border-slate-300 rounded-lg px-3 py-2">
                  <Mail className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailLinkModalOpen(false)}
                    className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {modalLoading ? 'Sending...' : 'Send Login Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
