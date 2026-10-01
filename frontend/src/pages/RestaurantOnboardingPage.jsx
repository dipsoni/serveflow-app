import React, { useState, useEffect } from 'react';
import {
  Store,
  Building2,
  Receipt,
  Grid,
  BookOpen,
  QrCode,
  CreditCard,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Check,
  Clock,
  Printer,
  FileCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RestaurantOnboardingPage() {
  const navigate = useNavigate();
  const { user, restaurant } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([1]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states across the 12 steps
  // Step 1: Restaurant Info
  const [restName, setRestName] = useState(restaurant?.name || 'Urban Spice Fusion');
  const [tagline, setTagline] = useState(restaurant?.tagline || 'Modern Flavors & Authentic Taste');
  const [businessType, setBusinessType] = useState('Fine Dine');

  // Step 2: Business Info
  const [ownerPhone, setOwnerPhone] = useState(restaurant?.phone || '+91 98765 00001');
  const [city, setCity] = useState('Ahmedabad');
  const [address, setAddress] = useState(restaurant?.address || 'SG Highway, Bodakdev');

  // Step 3: Branch / Outlet
  const [branchName, setBranchName] = useState('Main Flagship Branch');
  const [branchCode, setBranchCode] = useState('BR-01');
  const [openingTime, setOpeningTime] = useState('11:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');

  // Step 4: Tax / GST
  const [gstNumber, setGstNumber] = useState(restaurant?.gst_number || '24ABCDE1234F1Z5');
  const [taxRate, setTaxRate] = useState(5.0);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');

  // Step 5: Menu Categories
  const [categories, setCategories] = useState(['Chef Starters', 'Signature Mains', 'Wood-Fired Breads', 'Beverages & Mocktails', 'Artisanal Desserts']);
  const [newCat, setNewCat] = useState('');

  // Step 6: Menu Items
  const [sampleItems, setSampleItems] = useState([
    { name: 'Paneer Tikka Angara', price: 320, isVeg: true, cat: 'Chef Starters' },
    { name: 'Butter Garlic Naan', price: 90, isVeg: true, cat: 'Wood-Fired Breads' },
    { name: 'Classic Cold Brew Coffee', price: 180, isVeg: true, cat: 'Beverages & Mocktails' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Step 7: Tables
  const [tableCount, setTableCount] = useState(8);
  const [floorArea, setFloorArea] = useState('Main Dining Hall');

  // Step 8: QR Codes (Generated)
  const [qrGenerated, setQrGenerated] = useState(true);

  // Step 9: Payment Methods
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    upi: true,
    card: true,
    split: true
  });

  // Step 10: Staff
  const [staffRole, setStaffRole] = useState('Cashier');
  const [staffName, setStaffName] = useState('Rohan Cashier');
  const [staffEmail, setStaffEmail] = useState('cashier@myrestaurant.com');

  // Step 11: Roles & RBAC (Review)
  const [rolesReviewed, setRolesReviewed] = useState(true);

  // Fetch saved onboarding progress from server
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get('/restaurant/onboarding');
        if (res.data?.progress) {
          const p = res.data.progress;
          setCompletedSteps(p.completed_steps || [1]);
          setCurrentStep(p.current_step || 1);
        }
      } catch (err) {
        console.warn('Could not fetch onboarding progress', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const totalSteps = 12;
  const completedCount = completedSteps.length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalSteps) * 100));

  const stepsList = [
    { num: 1, title: 'Restaurant Information', icon: Store, desc: 'Brand name, tagline, and cuisine style' },
    { num: 2, title: 'Business Information', icon: Building2, desc: 'Contact details, city, and headquarters' },
    { num: 3, title: 'Branch / Outlet Setup', icon: Grid, desc: 'Primary dining outlet code & hours' },
    { num: 4, title: 'Tax & Invoicing', icon: Receipt, desc: 'GSTIN, 5% F&B tax, and invoice numbering' },
    { num: 5, title: 'Menu Categories', icon: BookOpen, desc: 'Starters, mains, beverages, desserts' },
    { num: 6, title: 'Menu Items Catalog', icon: BookOpen, desc: 'Signature dishes, pricing, veg/non-veg' },
    { num: 7, title: 'Dining Tables Layout', icon: Grid, desc: 'Floor plan, table numbers & seating' },
    { num: 8, title: 'QR Table Standees', icon: QrCode, desc: 'Contactless customer scan & order setup' },
    { num: 9, title: 'Payment Methods', icon: CreditCard, desc: 'Cash, UPI QR, card POS terminals' },
    { num: 10, title: 'Staff Accounts', icon: Users, desc: 'Managers, cashiers, chefs, and waiters' },
    { num: 11, title: 'Roles & Permissions', icon: ShieldCheck, desc: 'Verify decoupled spatial RBAC matrix' },
    { num: 12, title: 'Final Review & Go Live', icon: Sparkles, desc: 'System verification & launch POS' }
  ];

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      let stepData = null;
      if (currentStep === 1) stepData = { name: restName, tagline, businessType };
      if (currentStep === 2) stepData = { phone: ownerPhone, city, address };

      const res = await api.post('/restaurant/onboarding/step', {
        step: currentStep,
        data: stepData
      });

      if (res.data?.progress) {
        setCompletedSteps(res.data.progress.completed_steps);
      }

      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding
        await api.post('/restaurant/onboarding/complete');
        showToast('Congratulations! Your restaurant is officially live on ServeFlow OS.', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not save step progress', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top Banner */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{restName}</span>
              <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                PETPOOJA ONBOARDING
              </span>
            </div>
            <p className="text-xs text-slate-500">12-Step Assisted Restaurant Setup</p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-slate-800">
              {completedCount} / {totalSteps} Completed
            </div>
            <div className="text-[10px] text-slate-500">{progressPercent}% Ready to Serve</div>
          </div>

          <div className="w-28 sm:w-44 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 hidden md:block"
          >
            Exit to Dashboard
          </button>
        </div>
      </header>

      {/* Main Layout: Step Navigator & Step Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Steps Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Setup Milestones
            </div>
            {stepsList.map(s => {
              const Icon = s.icon;
              const isCompleted = completedSteps.includes(s.num);
              const isCurrent = currentStep === s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isCurrent
                      ? 'bg-orange-500 text-white font-bold shadow-xs'
                      : isCompleted
                      ? 'text-slate-800 hover:bg-slate-100 font-semibold'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-white text-orange-600'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted && !isCurrent ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <div className="truncate flex-1">
                    <div className="truncate">{s.title}</div>
                  </div>
                  {isCurrent && <ChevronRight className="w-4 h-4 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Step Content Card */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Step Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-orange-600 tracking-wider">
                  STEP {currentStep} OF {totalSteps}
                </span>
                {completedSteps.includes(currentStep) && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {stepsList[currentStep - 1]?.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {stepsList[currentStep - 1]?.desc}
              </p>
            </div>

            {/* STEP 1: Restaurant Info */}
            {currentStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Restaurant Brand Name *</label>
                  <input
                    type="text"
                    value={restName}
                    onChange={(e) => setRestName(e.target.value)}
                    placeholder="e.g. Copper Chimney Fine Dine"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tagline / Motto</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Authentic Charcoal Flavors & Kebabs"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hospitality Business Format</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Fine Dine">Fine Dine / Full Service Restaurant</option>
                    <option value="Quick Service (QSR)">Quick Service (QSR) / Fast Food</option>
                    <option value="Cafe / Bakery">Cafe, Bistro & Bakery</option>
                    <option value="Cloud Kitchen">Delivery-Only Cloud Kitchen</option>
                    <option value="Multi-Chain">Multi-Outlet Restaurant Chain</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Business Info */}
            {currentStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Owner Contact Phone *</label>
                    <input
                      type="text"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Headquarters City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Registered Address</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Branch / Outlet */}
            {currentStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Primary Branch Name *</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Branch Code *</label>
                    <input
                      type="text"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Opening Time</label>
                    <input
                      type="text"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Closing Time</label>
                    <input
                      type="text"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Tax / GST */}
            {currentStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="e.g. 24ABCDE1234F1Z5"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Restaurant GST Rate (%)</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900"
                    >
                      <option value="5.0">5.0% (Standard AC Restaurant)</option>
                      <option value="12.0">12.0% (Special Services)</option>
                      <option value="18.0">18.0% (Commercial / Alcohol Category)</option>
                      <option value="0.0">0% (Tax Exempt / Non-GST)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">POS Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Menu Categories */}
            {currentStep === 5 && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  Define top-level menu categories for your billing terminal and customer QR browsing.
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Add new category (e.g. Sizzlers & Grills)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCat) {
                        setCategories(prev => [...prev, newCat]);
                        setNewCat('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Menu Items */}
            {currentStep === 6 && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Add initial signature dishes. You can import comprehensive menus via Excel later in Menu Management.
                </p>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {sampleItems.map((item, i) => (
                    <div key={i} className="p-3 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-slate-400 ml-2">({item.cat})</span>
                      </div>
                      <div className="font-bold text-orange-600">₹{item.price}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Dish Name"
                    className="px-3 py-2 border border-slate-200 rounded-xl"
                  />
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Price (₹)"
                    className="px-3 py-2 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newItemName && newItemPrice) {
                        setSampleItems(prev => [...prev, { name: newItemName, price: Number(newItemPrice), isVeg: true, cat: 'Chef Starters' }]);
                        setNewItemName('');
                        setNewItemPrice('');
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: Tables */}
            {currentStep === 7 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Number of Tables to Auto-Create</label>
                    <input
                      type="number"
                      value={tableCount}
                      onChange={(e) => setTableCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Default Floor / Section Name</label>
                    <input
                      type="text"
                      value={floorArea}
                      onChange={(e) => setFloorArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-950 leading-relaxed">
                  ServeFlow will generate <strong>{tableCount} tables</strong> labeled <code>T-01</code> to <code>T-{String(tableCount).padStart(2, '0')}</code> on the <strong>{floorArea}</strong> floor.
                </div>
              </div>
            )}

            {/* STEP 8: QR Codes */}
            {currentStep === 8 && (
              <div className="space-y-4 text-xs text-center py-4">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <QrCode className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Contactless QR Ordering Ready</h4>
                  <p className="text-slate-500 mt-1 max-w-md mx-auto">
                    Unique encrypted QR links have been provisioned for all tables. Diners scan and immediately access your live menu.
                  </p>
                </div>
                <div className="inline-block p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 text-xs">
                  /public-menu/{restaurant?.id || 'rest-demo'}/BR-01/T-01
                </div>
              </div>
            )}

            {/* STEP 9: Payment Methods */}
            {currentStep === 9 && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">Enable payment methods allowed on counter POS billing terminals:</p>
                {[
                  { key: 'cash', label: 'Cash Payments with Denomination Calculator' },
                  { key: 'upi', label: 'UPI Direct Dynamic QR (PhonePe / GPay / Paytm)' },
                  { key: 'card', label: 'Credit / Debit Card EDC Terminals' },
                  { key: 'split', label: 'Split Payments (e.g. 50% Cash + 50% UPI)' }
                ].map(m => (
                  <label key={m.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentMethods[m.key]}
                      onChange={(e) => setPaymentMethods(prev => ({ ...prev, [m.key]: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">{m.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* STEP 10: Staff */}
            {currentStep === 10 && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500">Invite initial operational employees to this outlet:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Staff Name</label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email / Username</label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Role Designation</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Chef / Kitchen">Chef / Kitchen Staff</option>
                      <option value="Waiter">Floor Captain / Waiter</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 11: Roles & RBAC */}
            {currentStep === 11 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Decoupled RBAC Matrix Verified
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    ServeFlow decouples <strong>Permissions (WHAT can be done)</strong> from <strong>Spatial Branch Scope (WHERE it can be done)</strong>. Single-branch employees cannot tamper with other outlets.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 12: Final Review & Go Live */}
            {currentStep === 12 && (
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Your Restaurant is Ready to Go Live!</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    All core parameters for billing, branch security, table ordering, and KOT display are calibrated.
                  </p>
                </div>
                <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Restaurant:</span>
                    <span className="font-bold text-slate-800">{restName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">First Outlet:</span>
                    <span className="font-bold text-slate-800">{branchName} ({branchCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST / Tax:</span>
                    <span className="font-bold text-slate-800">{taxRate}% F&B GST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tables Configured:</span>
                    <span className="font-bold text-slate-800">{tableCount} Dine-In Tables</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous Step
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep < totalSteps && (
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Skip for now
                  </button>
                )}

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAndContinue}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    'Saving...'
                  ) : currentStep === totalSteps ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Complete Setup & Launch POS
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
