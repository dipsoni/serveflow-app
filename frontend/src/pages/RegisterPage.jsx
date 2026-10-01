import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();

  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(searchParams.get('plan') || 'plan-pro');
  const [billingCycle, setBillingCycle] = useState(searchParams.get('billing') || 'monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Fine Dine & Multi-Cuisine',
    email: '',
    mobile: '',
    address: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    gstNumber: '',
    ownerName: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredData, setRegisteredData] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/public/plans');
        setPlans(res.data.plans || []);
      } catch (err) {
        console.warn('Using default plans', err);
      }
    };
    fetchPlans();
  }, []);

  const fallbackPlans = [
    { id: 'plan-free', name: 'Free Demo / Trial', price: 0, max_branches: 1, max_staff: 3 },
    { id: 'plan-starter', name: 'Starter Growth', price: 2499, max_branches: 2, max_staff: 10 },
    { id: 'plan-pro', name: 'Pro Multi-Branch', price: 4999, max_branches: 5, max_staff: 35 },
    { id: 'plan-enterprise', name: 'Enterprise Chain OS', price: 9999, max_branches: 25, max_staff: 150 }
  ];

  const currentPlans = plans.length > 0 ? plans : fallbackPlans;
  const activePlan = currentPlans.find(p => p.id === selectedPlanId) || currentPlans[1];
  const payableAmount = billingCycle === 'yearly' && activePlan.price > 0 ? Math.round(activePlan.price * 0.8 * 12) : activePlan.price;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep2 = () => {
    if (!formData.businessName.trim()) {
      setError('Please enter your restaurant business name.');
      return false;
    }
    if (!formData.city.trim()) {
      setError('Please enter the city for your primary branch.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.ownerName.trim()) {
      setError('Please enter the owner / administrator name.');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid business email.');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setError('');
    setStep(step + 1);
  };

  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        planId: selectedPlanId,
        billingCycle,
        paymentMethod
      };

      const res = await api.post('/public/register', payload);
      const data = res.data;

      // Set global session so user is already authenticated
      if (data.token && data.user) {
        setSession(data.token, data.user, data.restaurant);
      }

      setRegisteredData(data);
      setStep(5); // Success step
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">ServeFlow</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Onboarding</span>
        </Link>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Already have an account?</span>
          <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold">Sign In</Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Step Indicator (Steps 1 to 4) */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className={step >= 1 ? 'text-orange-400' : ''}>1. Select Plan</span>
              <span className={step >= 2 ? 'text-orange-400' : ''}>2. Restaurant Details</span>
              <span className={step >= 3 ? 'text-orange-400' : ''}>3. Owner Account</span>
              <span className={step >= 4 ? 'text-orange-400' : ''}>4. Payment & Activation</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SELECT PLAN */}
        {step === 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="text-center max-w-lg mx-auto mb-8">
              <h2 className="text-2xl font-bold text-white">Choose Your Software Plan</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Select the subscription tier that fits your restaurant operations.</p>

              <div className="mt-4 inline-flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    billingCycle === 'monthly' ? 'bg-orange-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    billingCycle === 'yearly' ? 'bg-orange-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Annual (20% Off)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {currentPlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const effectivePrice = billingCycle === 'yearly' && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-white">{plan.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div className="text-2xl font-extrabold text-white mt-1">
                        ₹{effectivePrice.toLocaleString('en-IN')}
                        <span className="text-xs font-normal text-slate-400">/mo</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-3 space-y-1">
                        <div>• Up to {plan.max_branches} Branches</div>
                        <div>• {plan.max_staff} Staff Members</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                Continue to Business Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RESTAURANT BUSINESS DETAILS */}
        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-1">Restaurant & Business Information</h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">Enter your restaurant legal/brand name and primary outlet location.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Restaurant / Brand Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="e.g., Shree Food Restaurant, Urban Spice Foods"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Concept / Cuisine</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="Fine Dine & Multi-Cuisine">Fine Dine & Multi-Cuisine</option>
                  <option value="Quick Service Restaurant (QSR)">Quick Service Restaurant (QSR)</option>
                  <option value="Cafe & Coffee Roastery">Cafe & Coffee Roastery</option>
                  <option value="Cloud Kitchen & Delivery">Cloud Kitchen & Delivery</option>
                  <option value="Bakery & Confectionery">Bakery & Confectionery</option>
                  <option value="Bar & Brewery">Bar & Brewery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">GST Number (Optional)</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  placeholder="24ABCDE1234F1Z5"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Branch Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Shop 104, Galaxy Complex, Near City Center"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Ahmedabad"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Gujarat"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                Owner Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OWNER ACCOUNT DETAILS */}
        {step === 3 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-1">Owner & Administrator Credentials</h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">These credentials will be used to log in to your Restaurant Owner Dashboard.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Owner Full Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="e.g., Aditya Vikram, Sunil Patel"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="owner@yourrestaurant.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="+91 98980 12345"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                Proceed to Payment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT & ACTIVATION */}
        {step === 4 && (
          <form onSubmit={handleSubmitOnboarding} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-1">Verify & Activate Subscription</h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">Review your order summary and complete secure payment to generate your Restaurant ID.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Order Summary */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Summary</span>
                <div className="mt-3 flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="font-bold text-white text-sm">{activePlan.name}</div>
                    <div className="text-xs text-slate-400">Billing: {billingCycle.toUpperCase()}</div>
                  </div>
                  <div className="font-extrabold text-white text-base">₹{payableAmount.toLocaleString('en-IN')}</div>
                </div>

                <div className="py-3 border-b border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Business:</span>
                    <span className="font-semibold text-white">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner:</span>
                    <span className="font-semibold text-white">{formData.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Primary Branch:</span>
                    <span className="font-semibold text-white">{formData.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allowed Branches:</span>
                    <span className="font-semibold text-orange-400">{activePlan.max_branches} Outlets</span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Total Due Today:</span>
                  <span className="font-extrabold text-xl text-orange-400">₹{payableAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Payment Method</span>

                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('upi')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'upi' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800/20'
                    }`}
                  >
                    <input type="radio" name="paymethod" checked={paymentMethod === 'upi'} onChange={() => {}} className="text-orange-500" />
                    <div>
                      <div className="text-sm font-bold text-white">Instant UPI / QR Scanner</div>
                      <div className="text-[11px] text-slate-400">Google Pay, PhonePe, Paytm, BHIM</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'card' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800/20'
                    }`}
                  >
                    <input type="radio" name="paymethod" checked={paymentMethod === 'card'} onChange={() => {}} className="text-orange-500" />
                    <div>
                      <div className="text-sm font-bold text-white">Credit / Debit Card</div>
                      <div className="text-[11px] text-slate-400">Visa, Mastercard, RuPay, Amex</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'netbanking' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-800/20'
                    }`}
                  >
                    <input type="radio" name="paymethod" checked={paymentMethod === 'netbanking'} onChange={() => {}} className="text-orange-500" />
                    <div>
                      <div className="text-sm font-bold text-white">Corporate Net Banking</div>
                      <div className="text-[11px] text-slate-400">HDFC, ICICI, SBI, Axis & 50+ Banks</div>
                    </div>
                  </label>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>256-bit encrypted secure test gateway simulation. Server verifies payment before account activation.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-bold flex items-center gap-2 shadow-xl shadow-orange-500/25 disabled:opacity-50"
              >
                {loading ? 'Activating Account...' : `Pay ₹${payableAmount.toLocaleString('en-IN')} & Activate`}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: SUCCESS & ONBOARDING COMPLETE MODAL */}
        {step === 5 && registeredData && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              ACCOUNT ACTIVATED & LIVE
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4">
              Welcome to ServeFlow, {registeredData.user?.name}!
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Your restaurant enterprise operating system is provisioned and ready for operations.
            </p>

            {/* Generated Unique IDs */}
            <div className="my-6 p-5 rounded-2xl bg-slate-800/80 border border-slate-700 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs text-slate-400">Unique Restaurant ID:</span>
                <span className="font-mono text-base font-bold text-orange-400">{registeredData.businessId}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs text-slate-400">Owner User ID:</span>
                <span className="font-mono text-sm font-bold text-slate-200">{registeredData.ownerId}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs text-slate-400">Active Subscription:</span>
                <span className="text-xs font-bold text-emerald-400 uppercase">{registeredData.subscription?.plan_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Initial Branch:</span>
                <span className="text-xs font-semibold text-white">{registeredData.restaurant?.city} (Main Branch)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Launch Restaurant Owner Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
