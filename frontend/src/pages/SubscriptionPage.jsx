import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Check,
  Calendar,
  AlertTriangle,
  Building2,
  Users2,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Receipt,
  CheckCircle2,
  X,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function SubscriptionPage() {
  const { user, restaurant, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgrading, setUpgrading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('SELECT'); // SELECT -> PROCESSING -> SUCCESS

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/restaurant/subscription'),
        api.get('/public/plans')
      ]);
      setSubData(subRes.data);
      setPlans(plansRes.data.plans || []);
    } catch (err) {
      console.error('Error fetching subscription', err);
      showToast('Failed to load subscription details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    setPaymentStep('PROCESSING');

    try {
      // Simulate real-world gateway verification delay
      await new Promise((res) => setTimeout(res, 1200));

      const res = await api.post('/restaurant/subscription/upgrade', {
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle,
        payment_method: 'UPI / Online Gateway'
      });

      setPaymentStep('SUCCESS');
      showToast(`Successfully upgraded to ${selectedPlan.name}!`, 'success');
      setTimeout(() => {
        setUpgradeModalOpen(false);
        setPaymentStep('SELECT');
        fetchSubscription();
        if (refreshProfile) refreshProfile();
      }, 1500);
    } catch (err) {
      setPaymentStep('SELECT');
      showToast(err.response?.data?.message || 'Payment upgrade failed', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const currentPlan = subData?.plan || {
    name: 'Pro Tier',
    price: 1999,
    max_branches: 3,
    max_staff: 20,
    max_orders_per_month: 5000,
    features: ['POS Billing', 'Contactless QR Menu', 'KOT Kitchen Display', 'Inventory Management']
  };

  const subscription = subData?.subscription || {
    status: 'active',
    start_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const usage = subData?.usage || {
    branches: 2,
    staff: 5,
    orders: 38
  };

  const now = new Date();
  const expiry = new Date(subscription.expiry_date || subscription.end_date || Date.now());
  const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
  const isExpired = subscription.status === 'expired' || daysRemaining <= 0;
  const isExpiringSoon = daysRemaining <= 7 && !isExpired;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 text-purple-400" /> SaaS Subscription License
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Billing & Resource Limits
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Manage your restaurant plan tier, multi-branch capacity, active staff licenses, and billing invoices.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPlan(null);
            setUpgradeModalOpen(true);
          }}
          className="relative z-10 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Change / Upgrade Plan</span>
        </button>
      </div>

      {/* Subscription Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Current Active Plan */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Package
              </span>
              <span
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                  isExpired
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : isExpiringSoon
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-extrabold text-slate-900">{currentPlan.name}</h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-orange-600">
                  {currentPlan.price === 0 ? 'Free' : `₹${Number(currentPlan.price).toLocaleString()}`}
                </span>
                {currentPlan.price > 0 && (
                  <span className="text-xs text-slate-400 font-medium">/month</span>
                )}
              </div>
            </div>

            {/* Expiry and Days Remaining */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Days Remaining:
                </span>
                <span className="font-bold text-slate-900">
                  {isExpired ? '0 Days (Renew Now)' : `${daysRemaining} Days`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Next Renewal:
                </span>
                <span className="font-semibold text-slate-700">
                  {new Date(subscription.expiry_date || subscription.end_date || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Included Capabilities */}
            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Included Features
              </p>
              {(Array.isArray(currentPlan.features) ? currentPlan.features : []).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedPlan(null);
                setUpgradeModalOpen(true);
              }}
              className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold transition-colors"
            >
              Renew / Upgrade Subscription
            </button>
          </div>
        </div>

        {/* Right: Real-time Quota Limit Utilization */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Resource Capacity & Quota Consumption
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Our backend enforces strict multi-tenant boundary limits. If your business expands beyond these quotas, instantly upgrade without losing any branch data.
            </p>

            <div className="space-y-6">
              {/* Branches Quota */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Branch Outlets</p>
                      <p className="text-[10px] text-slate-400">Locations & physical restaurants</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {usage.branches} / {currentPlan.max_branches} Used
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.branches >= currentPlan.max_branches ? 'bg-amber-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, (usage.branches / currentPlan.max_branches) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Staff Quota */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Staff Accounts</p>
                      <p className="text-[10px] text-slate-400">Managers, Cashiers, Waiters, Kitchen</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {usage.staff} / {currentPlan.max_staff} Active
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.staff >= currentPlan.max_staff ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, (usage.staff / currentPlan.max_staff) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Monthly Orders Quota */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Monthly Orders Throughput</p>
                      <p className="text-[10px] text-slate-400">POS, Dine-in QR, Takeaway</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {usage.orders} / {currentPlan.max_orders_per_month ? currentPlan.max_orders_per_month.toLocaleString() : '5,000'} Orders
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(100, (usage.orders / (currentPlan.max_orders_per_month || 5000)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tenant Business ID: <strong className="font-mono text-slate-800">{restaurant?.id || 'REST-10001'}</strong></span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Multi-Tenant Hard Isolated
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade / Change Plan Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentStep === 'PROCESSING' ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Processing Server-Side Payment Verification...</h3>
                <p className="text-xs text-slate-500">
                  Communicating with payment gateway, generating transaction receipts, and updating tenant quota limits.
                </p>
              </div>
            ) : paymentStep === 'SUCCESS' ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Plan Upgraded Successfully!</h3>
                <p className="text-xs text-slate-500">
                  Your new quota limits are active immediately. Your restaurant account has been updated.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-center max-w-lg mx-auto mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Choose Your Subscription Tier</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a package that fits your restaurant branch expansion and staff requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {plans.map((p) => {
                    const isSelected = (selectedPlan?.id || currentPlan.name) === p.id || selectedPlan?.id === p.id;
                    const isCurrent = currentPlan.name === p.name;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlan(p)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/40 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute -top-3 left-4 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase rounded-full">
                            Current Tier
                          </span>
                        )}

                        <div>
                          <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                          <div className="mt-2 mb-3">
                            <span className="text-2xl font-extrabold text-slate-900">
                              {p.price === 0 ? 'Free' : `₹${Number(p.price).toLocaleString()}`}
                            </span>
                            {p.price > 0 && <span className="text-xs text-slate-400">/mo</span>}
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                            <p><strong>{p.max_branches}</strong> Branches Allowed</p>
                            <p><strong>{p.max_staff}</strong> Staff Accounts</p>
                            <p><strong>{p.max_orders_per_month ? p.max_orders_per_month.toLocaleString() : 'Unlimited'}</strong> Orders / mo</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select Tier'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {selectedPlan && (
                      <span>
                        Upgrading to <strong>{selectedPlan.name}</strong> for ₹{Number(selectedPlan.price).toLocaleString()}/month
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setUpgradeModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpgrade}
                      disabled={!selectedPlan || selectedPlan.name === currentPlan.name}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Confirm & Pay Subscription
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
