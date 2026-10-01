import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Layers,
  ShieldCheck,
  QrCode,
  ChefHat,
  Receipt,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Users2,
  Cpu,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  HelpCircle,
  Clock,
  Zap,
  PhoneCall,
  X,
  Phone,
  Mail,
  MapPin,
  UtensilsCrossed
} from 'lucide-react';
import api from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeFaq, setActiveFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assisted Sales Demo Lead Modal
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [demoForm, setDemoForm] = useState({
    restaurant_name: '',
    owner_name: '',
    mobile: '',
    email: '',
    city: '',
    number_of_branches: 1,
    restaurant_type: 'Fine Dine',
    daily_orders: '150-300',
    current_software: 'None / Excel',
    requirements: 'QR Table Ordering, Kitchen KDS, Thermal POS Billing',
    message: ''
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/public/plans');
        setPlans(res.data.plans || []);
      } catch (err) {
        console.warn('Failed to load live plans, using fallback', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!demoForm.restaurant_name || !demoForm.owner_name || !demoForm.mobile || !demoForm.email) {
      alert('Please fill in restaurant name, owner name, mobile number, and email.');
      return;
    }

    setDemoSubmitting(true);
    try {
      await api.post('/public/leads', demoForm);
      setDemoSuccess(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not submit demo request. Please try again.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const fallbackPlans = [
    {
      id: 'plan-free',
      name: 'Free Demo / Trial',
      price: 0,
      max_branches: 1,
      max_staff: 3,
      max_orders: 150,
      badge: 'Free Forever',
      features: [
        'Single Branch POS',
        'Basic Digital QR Menu',
        'Up to 3 Staff Accounts',
        'Standard Cash & UPI Billing',
        'Daily Sales Overview'
      ]
    },
    {
      id: 'plan-starter',
      name: 'Starter Growth',
      price: 2499,
      max_branches: 2,
      max_staff: 10,
      max_orders: 1500,
      badge: 'Popular for Cafes',
      features: [
        'Up to 2 Branches',
        'Interactive QR Ordering with Cart',
        'Kitchen Order Ticket (KOT) Display',
        'Inventory Stock Tracking & Low-Stock Alerts',
        'Up to 10 Staff with Role Permissions',
        'GST Tax Invoice & Thermal Receipt Printing'
      ]
    },
    {
      id: 'plan-pro',
      name: 'Pro Multi-Branch',
      price: 4999,
      max_branches: 5,
      max_staff: 35,
      max_orders: 10000,
      badge: 'Most Popular',
      popular: true,
      features: [
        'Up to 5 Branches with Instant Branch Switcher',
        'Decoupled Spatial Scope & Single-Branch Terminal Locking',
        'Unlimited QR Code Generations for all Tables',
        'Recipe BOM (Bill of Materials) & Food Costing',
        'Frappe/ERPNext 21-Role Permission Matrix',
        'Collaborative Notes, Activity Stream & IP Audit Trail',
        'Multi-Branch Consolidated Financial Reports',
        '24/7 Priority Support'
      ]
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Chain OS',
      price: 9999,
      max_branches: 25,
      max_staff: 150,
      max_orders: 999999,
      badge: 'For Multi-Unit Chains',
      features: [
        'Up to 25 Branches (Expandable Unlimited)',
        'Custom Role Builder & Granular Access Control',
        'Central Base Kitchen Commissary Indent & Route Planning',
        'Aggregator Sync (Swiggy / Zomato channel toggle)',
        'Tally / SAP ERP Accounting Data Export',
        'Dedicated Account Manager & Hardware Support'
      ]
    }
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  const faqs = [
    {
      q: 'How does Multi-Tenant isolation protect my restaurant data?',
      a: 'ServeFlow uses strict tenant separation. Every query, order, customer record, and report is scoped to your unique Business ID. Even across multiple branches, staff permissions are decoupled from spatial branch access.'
    },
    {
      q: 'Can I add more branches as my restaurant chain expands?',
      a: 'Yes! You can add new branches instantly from your Owner Dashboard. If you reach your plan limit, you can upgrade your subscription with one click to expand to up to 25 or unlimited outlets.'
    },
    {
      q: 'Do customers need to download an app to order via QR code?',
      a: 'No app download is required! Customers simply scan the unique QR code on their dining table using their phone camera, browse your live visual menu, add items to cart, and send their order directly to your kitchen display.'
    },
    {
      q: 'How does Kitchen Order Ticket (KOT) sync work across branches?',
      a: 'Orders sent from POS billing or customer QR tables instantly appear on the Kitchen Display Screen for that specific branch. Staff can update prep statuses (Preparing, Ready, Served) in real time.'
    },
    {
      q: 'What payment methods are supported for customers and billing?',
      a: 'ServeFlow supports Cash, UPI QR code scanning, Credit/Debit cards, split payments, and direct net banking with GST compliant thermal printing.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">ServeFlow</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">SAAS PLATFORM</span>
              </div>
              <p className="text-xs text-slate-400">Enterprise Restaurant OS</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-orange-400 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing & Plans</a>
            <a href="#how-it-works" className="hover:text-orange-400 transition-colors">Business Flow</a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDemoModalOpen(true); setDemoSuccess(false); }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Book a Demo
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/admin/login"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-orange-400 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              Super Admin
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-orange-400 text-xs font-medium mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Restaurant Management SaaS Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
            Streamline Multiple Branches, Kitchens, & Billing in{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              One Cloud OS.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            The all-in-one restaurant SaaS engine. Scale from a single flagship cafe to multi-city dining franchises with hard tenant isolation, granular RBAC permissions, mobile QR dining, real-time KOT displays, and centralized head office analytics.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => { setDemoModalOpen(true); setDemoSuccess(false); }}
              className="px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-xl shadow-orange-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <PhoneCall className="w-5 h-5" />
              Book a Live Demo
            </button>
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all flex items-center gap-2"
            >
              Start Free 14-Day Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-4 rounded-xl text-base font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-orange-400" />
              Live Interactive Demo
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-bold text-white">0.8s</div>
              <div className="text-xs text-slate-400 mt-0.5">Ultra-Fast POS Checkout</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-bold text-orange-400">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Multi-Tenant Isolated</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-bold text-white">21 Roles</div>
              <div className="text-xs text-slate-400 mt-0.5">Frappe RBAC Matrix</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl font-bold text-amber-400">Real-Time</div>
              <div className="text-xs text-slate-400 mt-0.5">Kitchen KOT Live Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM HIERARCHY ARCHITECTURE */}
      <section className="py-20 bg-slate-950 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              ENTERPRISE MULTI-TENANCY HIERARCHY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">
              Built for Scale: From SaaS Super Admin to Dining Guest
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              Four distinct, isolated tiers ensure data sovereignty and operational efficiency across the entire hospitality lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 hover:border-orange-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Level 1</div>
              <h3 className="text-lg font-bold text-white mt-1">SUPER ADMIN</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Platform owner controls subscription plans, monitors platform MRR, manages restaurant tenants, and tracks billing receipts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 hover:border-orange-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Level 2</div>
              <h3 className="text-lg font-bold text-white mt-1">RESTAURANT OWNER</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Creates multiple branches, defines custom roles and permissions, configures master menu catalogs, and views consolidated reports.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 hover:border-orange-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <Users2 className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Level 3</div>
              <h3 className="text-lg font-bold text-white mt-1">BRANCH & STAFF</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Managers, Cashiers, Waiters, and Kitchen staff execute operations according to their assigned roles and branch scopes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 hover:border-orange-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Level 4</div>
              <h3 className="text-lg font-bold text-white mt-1">DINING GUEST</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Scans table-specific QR code, explores the branch visual menu, customizes add-ons, and places orders directly to kitchen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SOLUTIONS SECTION (TAILORED HOSPITALITY VERTICALS) */}
      <section id="solutions" className="py-24 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              INDUSTRY SOLUTIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4">
              Engineered for Every Hospitality Concept
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Whether you operate a fast-paced QSR counter or a multi-city dining group, ServeFlow adapts to your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Fine Dine & Casual Dining</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Interactive dining floor plan, table reservation management, split billing, course-wise KOT firing, and contactless table QR ordering.
                </p>
              </div>
              <button
                onClick={() => {
                  setDemoForm(prev => ({ ...prev, restaurant_type: 'Fine Dine' }));
                  setDemoModalOpen(true);
                }}
                className="mt-6 text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 self-start"
              >
                Request Fine Dine Demo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Quick Service (QSR)</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Sub-second cashier order punch, token calling displays, thermal high-speed printing, UPI dynamic QR scanning, and combo modifiers.
                </p>
              </div>
              <button
                onClick={() => {
                  setDemoForm(prev => ({ ...prev, restaurant_type: 'Quick Service (QSR)' }));
                  setDemoModalOpen(true);
                }}
                className="mt-6 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start"
              >
                Request QSR Demo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Multi-Outlet Chains</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Central head office menu control, commissary indents, consolidated multi-branch P&L, store-level inventory transfers, and area manager permissions.
                </p>
              </div>
              <button
                onClick={() => {
                  setDemoForm(prev => ({ ...prev, restaurant_type: 'Multi-Chain', number_of_branches: 4 }));
                  setDemoModalOpen(true);
                }}
                className="mt-6 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start"
              >
                Request Multi-Chain Demo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <ChefHat className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Cafes & Bakeries</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Recipe costing, raw bean/dairy wastage tracking, dynamic beverage syrups add-on modifiers, loyalty CRM, and digital receipt delivery.
                </p>
              </div>
              <button
                onClick={() => {
                  setDemoForm(prev => ({ ...prev, restaurant_type: 'Cafe / Bakery' }));
                  setDemoModalOpen(true);
                }}
                className="mt-6 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start"
              >
                Request Cafe Demo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE SAAS CAPABILITIES */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              END-TO-END SAAS MODULES
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4">
              Everything Your Restaurant Needs Under One Roof
            </h2>
            <p className="text-slate-400 mt-4 text-lg">
              Engineered with modern Frappe / ERPNext ergonomics and PetPooja-scale operational reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Branch Head Office</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Manage all your locations (e.g., Satellite, Bopal, SG Highway) with an interactive top-header branch switcher or consolidated corporate HQ views.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Plan-based branch limits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Spatial boundary enforcement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Single-branch terminal locks</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Custom Roles & Permissions (RBAC)</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Complete Role-Based Access Control. Create custom roles with an ERP 6-action permission matrix (View, Create, Edit, Delete, Export, Approve) across 12 modules.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Decoupled roles from branch scopes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Backend 403 authorization guard</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Collaborative notes & IP audit trail</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Table QR Code Ordering</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Generate distinct QR codes for every branch and dining table. Guests scan with zero app install, review photo menus with dietary tags, and send orders.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct Kitchen KDS ticket dispatch</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Printable high-res QR tent cards</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mobile-first responsive cart</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Kitchen Display System (KDS)</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                A large touch-friendly KOT board for kitchen chefs. Color-coded order aging timers, cooking status toggles (Accept, Preparing, Ready), and special chef notes.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Branch-isolated KDS views</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Modifier & custom add-on highlights</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Audible chime on new ticket</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Speed POS Billing & GST Invoicing</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Sub-second order punch, table merges, split billing, discounts, automated GST calculations, and ESC/POS thermal printer integration.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> UPI QR, Card, and Cash reconciliation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dine-in, Takeaway, and Delivery orders</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Digital receipt sharing via WhatsApp/SMS</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Enterprise Financial Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Cross-location comparative reporting. Track gross revenue, net checks, dish velocity, category contributions, and staff productivity with CSV export.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Filter by date, branch, and payment channel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated end-of-day Z-Report</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Food cost variance & wastage logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING & SUBSCRIPTION PLANS */}
      <section id="pricing" className="py-24 bg-slate-950/70 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              TRANSPARENT SUBSCRIPTION PRICING
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4">
              Flexible Plans Built to Scale With You
            </h2>
            <p className="text-slate-400 mt-4 text-lg">
              Start with our risk-free demo or choose an enterprise plan to power your restaurant chain.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  SAVE 15%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayPlans.map((plan) => {
              const isPopular = plan.popular || plan.badge === 'Most Popular';
              const effectivePrice = billingCycle === 'yearly' ? Math.round(plan.price * 0.85) : plan.price;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 relative ${
                    isPopular
                      ? 'bg-slate-800/90 border-2 border-orange-500 shadow-xl shadow-orange-500/10'
                      : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] tracking-wider uppercase shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {plan.badge || 'Plan'}
                      </span>
                    </div>

                    <div className="my-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white">₹{effectivePrice.toLocaleString('en-IN')}</span>
                        <span className="text-slate-400 text-sm">/ month</span>
                      </div>
                      {billingCycle === 'yearly' && plan.price > 0 && (
                        <p className="text-xs text-emerald-400 mt-1">Billed annually (₹{(effectivePrice * 12).toLocaleString('en-IN')}/yr)</p>
                      )}
                    </div>

                    <div className="space-y-3 py-4 border-y border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Branches Allowed</span>
                        <span className="font-bold text-white">{plan.max_branches >= 25 ? 'Unlimited / 25+' : `${plan.max_branches} Outlets`}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Staff Accounts</span>
                        <span className="font-bold text-white">{plan.max_staff} Users</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Monthly Orders</span>
                        <span className="font-bold text-white">{plan.max_orders >= 999999 ? 'Unlimited' : plan.max_orders.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-6 mb-8">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Included Features</p>
                      <ul className="space-y-3">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <Check className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={`/register?plan=${plan.id}&billing=${billingCycle}`}
                      className={`w-full py-3.5 rounded-xl text-center text-sm font-bold block transition-all shadow-md ${
                        isPopular
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {plan.price === 0 ? 'Start Free Trial' : 'Select Plan & Register'}
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setDemoForm(prev => ({ ...prev, requirements: `Interested in ${plan.name} (${plan.max_branches} branches)` }));
                        setDemoModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl text-center text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      Or Book a Guided Demo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS (PETPOOJA BUSINESS FLOW) */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              PETPOOJA-STYLE BUSINESS FLOW
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4">
              Assisted Sales & Guided Onboarding
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              From requirement discovery to multi-branch live operation, experience an enterprise hospitality rollout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">1</div>
              <h3 className="text-base font-bold text-white mb-2">Book a Demo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit your restaurant outlets, daily order scale, and current software pain points.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">2</div>
              <h3 className="text-base font-bold text-white mb-2">Requirement Call</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super Admin / Sales team conducts live demo and finalizes custom multi-branch subscription plan.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">3</div>
              <h3 className="text-base font-bold text-white mb-2">Tenant Provisioning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super Admin creates isolated restaurant tenant (REST-XXXX) and provisions Owner credentials.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4">4</div>
              <h3 className="text-base font-bold text-white mb-2">12-Step Wizard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Owner configures outlets, GST, master menu, table layouts, QR standees, and staff RBAC roles.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mb-4">5</div>
              <h3 className="text-base font-bold text-white mb-2">GO LIVE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cashiers punch POS bills, kitchen chefs track KDS tickets, and diners scan contactless QR codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 mt-2 text-sm">Everything you need to know about the ServeFlow multi-tenant platform.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-orange-400 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-90 text-orange-400' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">ServeFlow Platform</span>
              <p className="text-[11px] text-slate-500">Next-Gen Multi-Company Restaurant Operating System</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => { setDemoModalOpen(true); setDemoSuccess(false); }}
              className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              Book a Demo
            </button>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Get Started</Link>
            <Link to="/admin/login" className="hover:text-orange-400 transition-colors">Super Admin Portal</Link>
          </div>

          <div className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} ServeFlow Inc. All rights reserved. Hard Multi-Tenancy Architecture.
          </div>
        </div>
      </footer>

      {/* 10. DEMO REQUEST MODAL (PETPOOJA LEAD CAPTURE) */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {demoSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Demo Request Received!</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-white">{demoForm.owner_name}</strong>! Our hospitality solution consultant will contact you at <span className="text-orange-400 font-semibold">{demoForm.mobile}</span> within 2 business hours to schedule your personalized walkthrough.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                  <div><strong>Restaurant:</strong> {demoForm.restaurant_name} ({demoForm.city})</div>
                  <div><strong>Scale:</strong> {demoForm.number_of_branches} Branches • {demoForm.restaurant_type}</div>
                  <div><strong>Status:</strong> Routed to Super Admin Sales Queue</div>
                </div>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                      ASSISTED DEMO
                    </span>
                    <span className="text-xs text-slate-400">Speak With Our Solution Architect</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mt-1">
                    Book a Live Product Walkthrough
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Discover how ServeFlow powers multi-outlet POS billing, table QR ordering, and real-time kitchen displays.
                  </p>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Restaurant / Brand Name *</label>
                      <input
                        type="text"
                        required
                        value={demoForm.restaurant_name}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                        placeholder="e.g. Copper Chimney"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Owner / Manager Name *</label>
                      <input
                        type="text"
                        required
                        value={demoForm.owner_name}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, owner_name: e.target.value }))}
                        placeholder="e.g. Rajesh Singhania"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={demoForm.mobile}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="+91 98765 00000"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={demoForm.email}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="rajesh@restaurant.com"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={demoForm.city}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="e.g. Mumbai, Ahmedabad"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Number of Outlets</label>
                      <select
                        value={demoForm.number_of_branches}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, number_of_branches: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value={1}>1 Outlet (Single Branch)</option>
                        <option value={2}>2 Outlets</option>
                        <option value={4}>3 - 5 Outlets</option>
                        <option value={8}>6 - 15 Outlets</option>
                        <option value={25}>15+ Outlets (Chain)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Restaurant Format</label>
                      <select
                        value={demoForm.restaurant_type}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, restaurant_type: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="Fine Dine">Fine Dine / Full Service</option>
                        <option value="Quick Service (QSR)">Quick Service (QSR)</option>
                        <option value="Cafe / Bakery">Cafe / Bakery</option>
                        <option value="Cloud Kitchen">Delivery Cloud Kitchen</option>
                        <option value="Multi-Chain">Multi-Outlet Chain</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Daily Orders Volume</label>
                      <select
                        value={demoForm.daily_orders}
                        onChange={(e) => setDemoForm(prev => ({ ...prev, daily_orders: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="<50">Less than 50 orders</option>
                        <option value="50-150">50 - 150 orders / day</option>
                        <option value="150-300">150 - 300 orders / day</option>
                        <option value="300-600">300 - 600 orders / day</option>
                        <option value="600+">600+ orders / day</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Current Software (if any)</label>
                    <input
                      type="text"
                      value={demoForm.current_software}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, current_software: e.target.value }))}
                      placeholder="e.g. Legacy Desktop POS, Excel sheets, Petpooja, none"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Specific Requirements or Message</label>
                    <textarea
                      rows={3}
                      value={demoForm.message}
                      onChange={(e) => setDemoForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Tell us about your kitchen hardware, printer preferences, or multi-branch expansion plans..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDemoModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={demoSubmitting}
                      className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25 flex items-center gap-2 disabled:opacity-50"
                    >
                      {demoSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="w-4 h-4" />
                          Confirm & Book Demo
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
