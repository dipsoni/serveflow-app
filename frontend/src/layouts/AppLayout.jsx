import React, { useState, useEffect, useRef, Component } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

// ─── Page-level Error Boundary ──────────────────────────────────────────────
// Catches runtime crashes in any module page and shows a recoverable error UI
// instead of a silent white screen. Resets when the user navigates away.
class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary] Page crashed:', error, info);
  }
  componentDidUpdate(prevProps) {
    // Reset when the route changes so the next page renders fresh
    if (prevProps.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-5">This page encountered an error. Try navigating to another module or refresh.</p>
            <p className="text-[11px] font-mono bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-5 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// ────────────────────────────────────────────────────────────────────────────
import {
  Home,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  Grid,
  BookOpen,
  Boxes,
  Truck,
  Building2,
  Users,
  UserCheck,
  ReceiptText,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Menu as MenuIcon,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Check,
  CreditCard,
  Layers,
  Sparkles,
  Command,
  Sun,
  Maximize2,
  RefreshCw,
  Sliders,
  User,
  CookingPot,
  Landmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HIERARCHICAL_MODULES } from '../utils/moduleRegistry';
import api from '../services/api';

export default function AppLayout() {
  const {
    user,
    restaurant,
    logout,
    canAccess,
    canViewParent,
    activeBranch,
    activeBranchId,
    assignedBranches,
    isMultiBranchUser,
    isBranchLocked,
    isAllBranchesAllowed,
    isBranchSwitching,
    switchBranch
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & Dropdown states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('serveflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [publicOpen, setPublicOpen] = useState(true);
  const [expandedParents, setExpandedParents] = useState({
    operations: true,
    inventory: true,
    accounts: true,
    administration: true
  });
  const toggleParent = (parentId) => {
    setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Loading UI states for module navigation
  const [navLoading, setNavLoading] = useState(false);
  // branchSwitchingName for the overlay text
  const [branchSwitchingName, setBranchSwitchingName] = useState('');

  // Trigger sleek top loading bar whenever location changes (module navigation)
  useEffect(() => {
    setNavLoading(true);
    const timer = setTimeout(() => {
      setNavLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Handle branch switch with loading UI
  const handleBranchSwitch = (branchId, branchName) => {
    if (isBranchSwitching) return; // prevent double-click during active switch
    setBranchDropdownOpen(false);
    setBranchSwitchingName(branchName);
    const switched = switchBranch(branchId);
    if (switched) {
      setTimeout(() => {
        showToast(`Switched to ${branchName}`, 'info');
      }, 650);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('serveflow_sidebar_collapsed', String(sidebarCollapsed));
    } catch (e) {
      console.error(e);
    }
  }, [sidebarCollapsed]);

  // Global Command Search (Ctrl + G) State (Screenshot 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Keyboard shortcut listener for Ctrl+G or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const searchInput = document.getElementById('global-command-search-input');
        if (searchInput) {
          searchInput.focus();
          setSearchFocused(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data || []);
        setUnreadCount((res.data || []).filter(n => !n.is_read).length);
      } catch (e) {
        console.error('Error fetching notifications', e);
      }
    };
    fetchNotifications();
  }, [location.pathname]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotificationsOpen(false);
      if (link) navigate(link);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  // Search Commands & Items Catalog (Screenshot 3 matching)
  const COMMAND_ITEMS = [
    { label: 'Home Workspace', category: 'Workspaces', path: '/dashboard', module: 'dashboard' },
    { label: 'POS Terminal (Billing)', category: 'Sales & Invoices', path: '/pos', module: 'pos' },
    { label: 'Orders List', category: 'Sales & Invoices', path: '/orders', module: 'orders' },
    { label: 'Kitchen KOT Display (KDS)', category: 'Kitchen', path: '/kot', module: 'kot' },
    { label: 'Dining Tables', category: 'Restaurant Operations', path: '/tables', module: 'tables' },
    { label: 'Menu & Catalog Items', category: 'Restaurant Floor', path: '/menu', module: 'menu' },
    { label: 'Recipes & BOM (Costing)', category: 'Kitchen & BOM', path: '/recipes', module: 'recipes' },
    { label: 'Stock & Inventory Ledger', category: 'Stock & Supply', path: '/inventory', module: 'inventory' },
    { label: 'Purchase Invoices', category: 'Stock & Supply', path: '/purchases', module: 'purchases' },
    { label: 'Suppliers Directory', category: 'Stock & Supply', path: '/suppliers', module: 'suppliers' },
    { label: 'Customer Directory', category: 'CRM & Guests', path: '/customers', module: 'customers' },
    { label: 'Operating Expenses', category: 'Accounts & Tax', path: '/expenses', module: 'expenses' },
    { label: 'Sales & Profit Reports', category: 'Accounts & Tax', path: '/reports', module: 'reports' },
    { label: 'Users', category: 'System Governance', path: '/erp/users', module: 'erpUsers' },
    { label: 'User Directory', category: 'Users', path: '/erp/users', module: 'erpUsers' },
    { label: 'Branch Outlets Setup', category: 'System Governance', path: '/branches', module: 'branches' },
    { label: 'Roles & RBAC Matrix', category: 'System Governance', path: '/roles', module: 'roles' },
    { label: 'Subscription & Limits', category: 'Administration', path: '/subscription', module: 'subscription' },
    { label: 'Store Settings & GST Rules', category: 'Administration', path: '/settings', module: 'settings' },
    { label: 'Help & Support Desk', category: 'Helpdesk', path: '/support', module: 'support' },
  ];

  // Filter commands by search query and user permissions
  const filteredCommands = COMMAND_ITEMS.filter(item => {
    const matchesAccess = !item.module || canAccess(item.module);
    const matchesQuery = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAccess && matchesQuery;
  });

  // Frappe ERP Sidebar Link Style (Screenshot 1: Soft gray active pill, 12px text, compact)
  const navLinkClass = ({ isActive }) =>
    `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-1.5'} text-xs rounded transition-all duration-150 group ${
      isActive
        ? 'bg-slate-100 text-slate-950 font-semibold shadow-2xs border-l-2 border-slate-900 -ml-0.5'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50/80 hover:translate-x-0.5'
    }`;

  // Current page breadcrumb label
  const getBreadcrumbLabel = () => {
    const path = location.pathname;
    if (path.includes('/erp/users') || path.includes('/users')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>User</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-slate-800 font-medium">{user?.email || 'raj.gupta@abcfoods.com'}</span>
        </div>
      );
    }
    if (path === '/dashboard') return <span className="text-xs font-semibold text-slate-800">Home</span>;
    if (path === '/pos') return <span className="text-xs font-semibold text-slate-800">Point of Sale (POS)</span>;
    if (path === '/orders') return <span className="text-xs font-semibold text-slate-800">Orders</span>;
    if (path === '/kot') return <span className="text-xs font-semibold text-slate-800">Kitchen Display (KOT)</span>;
    if (path === '/tables') return <span className="text-xs font-semibold text-slate-800">Dining Tables</span>;
    if (path === '/menu') return <span className="text-xs font-semibold text-slate-800">Menu & Catalog</span>;
    if (path.startsWith('/recipes')) return <span className="text-xs font-semibold text-slate-800">Recipes & BOM</span>;
    if (path === '/inventory') return <span className="text-xs font-semibold text-slate-800">Stock & Inventory</span>;
    if (path === '/purchases') return <span className="text-xs font-semibold text-slate-800">Purchases</span>;
    if (path === '/suppliers') return <span className="text-xs font-semibold text-slate-800">Suppliers</span>;
    if (path === '/customers') return <span className="text-xs font-semibold text-slate-800">Customers</span>;
    if (path === '/expenses') return <span className="text-xs font-semibold text-slate-800">Expenses</span>;
    if (path === '/reports') return <span className="text-xs font-semibold text-slate-800">Reports</span>;
    if (path === '/branches') return <span className="text-xs font-semibold text-slate-800">Branches</span>;
    if (path === '/roles') return <span className="text-xs font-semibold text-slate-800">Roles & RBAC</span>;
    if (path === '/subscription') return <span className="text-xs font-semibold text-slate-800">Subscription & Limits</span>;
    if (path === '/settings') return <span className="text-xs font-semibold text-slate-800">Settings</span>;
    if (path === '/support') return <span className="text-xs font-semibold text-slate-800">Support Desk</span>;
    return <span className="text-xs font-semibold text-slate-800">Home</span>;
  };

  const SIDEBAR_MODULES = [
    { key: 'dashboard', label: 'Home', path: '/dashboard', icon: Home },
    { key: 'pos', label: 'Point of Sale', path: '/pos', icon: UtensilsCrossed },
    { key: 'orders', label: 'Orders', path: '/orders', icon: ShoppingBag },
    { key: 'kot', label: 'Kitchen (KOT)', path: '/kot', icon: ChefHat },
    { key: 'tables', label: 'Dining Tables', path: '/tables', icon: Grid },
    { key: 'menu', label: 'Menu & Catalog', path: '/menu', icon: BookOpen },
    { key: 'recipes', label: 'Recipes (BOM)', path: '/recipes', icon: CookingPot },
    { key: 'inventory', label: 'Stock & Inventory', path: '/inventory', icon: Boxes },
    { key: 'purchases', label: 'Purchases', path: '/purchases', icon: Truck },
    { key: 'suppliers', label: 'Suppliers', path: '/suppliers', icon: Building2 },
    { key: 'customers', label: 'CRM & Customers', path: '/customers', icon: Users },
    { key: 'expenses', label: 'Expenses', path: '/expenses', icon: ReceiptText },
    { key: 'reports', label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { key: 'erpUsers', label: 'Users', path: '/erp/users', icon: ShieldCheck },
    { key: 'branches', label: 'Branches', path: '/branches', icon: Building2 },
    { key: 'roles', label: 'Roles & RBAC', path: '/roles', icon: Layers },
    { key: 'subscription', label: 'Subscription', path: '/subscription', icon: CreditCard },
    { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    { key: 'support', label: 'Support Desk', path: '/support', icon: HelpCircle },
  ];

  const ICON_MAP = {
    Home,
    UtensilsCrossed,
    ShoppingBag,
    ChefHat,
    Grid,
    BookOpen,
    Boxes,
    Truck,
    Building2,
    Users,
    ReceiptText,
    BarChart3,
    ShieldCheck,
    Layers,
    CreditCard,
    Settings,
    HelpCircle,
    CookingPot,
    Landmark,
    LayoutDashboard,
    Flame,
    CheckCircle2
  };

  return (
    <div className="min-h-screen bg-[#f4f5f6] flex flex-col font-sans text-slate-800 relative">

      {/* Top Loading Progress Bar for Module Navigation */}
      {navLoading && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 overflow-hidden bg-slate-200">
          <div className="h-full bg-slate-900 animate-[loadingProgress_0.35s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Branch Switching Loading Overlay — driven by isBranchSwitching from AuthContext */}
      {isBranchSwitching && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 flex items-center gap-3.5 max-w-sm w-full mx-4">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-900">Switching Branch Outlet...</p>
              <p className="text-[11px] text-slate-500 truncate">{branchSwitchingName || 'Updating workspace scope'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER (Matching Screenshots 1, 2, 3: Logo, Breadcrumbs, Ctrl+G Search, Bell, Help, Avatar) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-12 flex items-center justify-between px-4">
        {/* Left: Logo & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
            aria-label="Open menu"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          {/* Clean ERP Logo Mark (Matching Screenshot 1 & 2) */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-white">
              <Flame className="w-3 h-3 text-orange-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900 group-hover:text-slate-700">
              {restaurant?.name || 'ServeFlow'}
            </span>
          </NavLink>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Breadcrumb Section */}
          <div className="hidden sm:flex items-center">
            {getBreadcrumbLabel()}
          </div>
        </div>

        {/* Center: Command Search Input with Interactive Dropdown (Screenshot 3) */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-sm sm:max-w-md mx-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              id="global-command-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search or type a command (Ctrl + G)"
              className="w-full text-xs pl-8 pr-16 py-1.5 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 text-slate-800 placeholder-slate-400 transition-all duration-150 shadow-2xs"
            />
            <kbd className="kbd-key absolute right-2 top-1.5 shadow-2xs">
              Ctrl + G
            </kbd>
          </div>

          {/* Command Search Dropdown List (Screenshot 3) */}
          {searchFocused && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-y-auto z-50 py-1 text-xs">
              {filteredCommands.length === 0 ? (
                <div className="px-3 py-2 text-slate-400 text-center">No matching records found</div>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      navigate(cmd.path);
                      setSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer group"
                  >
                    <span className="text-slate-800 group-hover:text-slate-950">{cmd.label}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{cmd.category}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Branch Selector, Notifications, Help Dropdown, User Dropdown */}
        <div className="flex items-center gap-2">
          {/* Active Branch Switcher (Multi-Branch CEO / HQ) */}
          {isMultiBranchUser ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                disabled={isBranchSwitching}
                className={`flex items-center gap-1.5 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-700 cursor-pointer transition-opacity ${
                  isBranchSwitching ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Building2 className="w-3 h-3 text-slate-500" />
                <span className="max-w-[100px] truncate">{activeBranch?.name || 'All Branches'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {branchDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded shadow-md z-50 py-1 text-xs">
                  {isAllBranchesAllowed && (
                    <button
                      type="button"
                      onClick={() => handleBranchSwitch('ALL', 'All Branches (Consolidated HQ)')}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                        activeBranchId === 'ALL' ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-700'
                      }`}
                    >
                      <span>All Branches (Consolidated)</span>
                      {activeBranchId === 'ALL' && <Check className="w-3.5 h-3.5 text-slate-900" />}
                    </button>
                  )}
                  {assignedBranches.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBranchSwitch(b.id, `${b.name} (${b.city})`)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                        activeBranchId === b.id ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-700'
                      }`}
                    >
                      <span>{b.name} ({b.city})</span>
                      {activeBranchId === b.id && <Check className="w-3.5 h-3.5 text-slate-900" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600 cursor-default"
              title="Branch locked to designated terminal station"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="max-w-[100px] truncate">{activeBranch?.name}</span>
            </div>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-md border border-slate-200 shadow-lg z-50 text-xs py-1">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Notifications</span>
                  <span className="text-[10px] text-slate-400">{unreadCount} unread</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id, n.link)}
                        className={`p-2.5 hover:bg-slate-50 cursor-pointer ${!n.is_read ? 'bg-slate-50/80 font-medium' : ''}`}
                      >
                        <p className="text-slate-800 leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Dropdown (Matching Screenshot 1 & 2) */}
          <div className="relative">
            <button
              onClick={() => setHelpDropdownOpen(!helpDropdownOpen)}
              className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
            >
              <span>Help</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {helpDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded shadow-md z-50 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => { setHelpDropdownOpen(false); navigate('/support'); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Support Desk
                </button>
                <button
                  type="button"
                  onClick={() => { setHelpDropdownOpen(false); showToast('Keyboard shortcut: Press Ctrl+G to search any module or document', 'info'); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Keyboard Shortcuts
                </button>
                <button
                  type="button"
                  onClick={() => { setHelpDropdownOpen(false); window.open('/menu/restaurant-demo', '_blank'); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Customer QR Menu
                </button>
              </div>
            )}
          </div>

          {/* User Avatar with Exact Dropdown Menu (Screenshot 2) */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-slate-300 transition-all cursor-pointer"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'}
                alt={user?.name || 'User Avatar'}
                className="w-7 h-7 rounded-full object-cover border border-slate-200"
              />
            </button>

            {/* Exact Frappe Dropdown Menu (Screenshot 2) */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 text-xs divide-y divide-slate-100">
                <div className="px-3 py-1.5">
                  <p className="font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      const targetId = user?.id || '';
                      navigate(`/erp/users?id=${encodeURIComponent(targetId)}`);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); navigate('/settings'); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>My Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); showToast(`Default Branch: ${activeBranch?.name}`, 'info'); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    Session Defaults
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); window.location.reload(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>Reload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); window.open('/menu/restaurant-demo', '_blank'); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                    <span>View Website</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); showToast('Apps Directory loaded', 'info'); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    Apps
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); showToast('Full width mode toggled', 'info'); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <Maximize2 className="w-3 h-3 text-slate-400" />
                    <span>Toggle Full Width</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); showToast('Theme: Standard Light Active', 'info'); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <Sun className="w-3 h-3 text-slate-400" />
                    <span>Toggle Theme</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setUserDropdownOpen(false); handleLogout(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-medium"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: LEFT SIDEBAR + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR (Interactive Hamburger button marked red in user screenshot) */}
        <aside 
          className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-14 p-2' : 'w-56 p-3'} bg-white border-r border-slate-200 shrink-0 h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto space-y-3 transition-all duration-200 ease-in-out select-none`}
        >
          {/* Top Home Title with Interactive Hamburger Button (Red-marked in user screenshot) */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-1 py-1 text-slate-800`}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                id="sidebar-toggle-modules-btn"
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center ${
                  sidebarCollapsed 
                    ? 'bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200' 
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
                title={sidebarCollapsed ? "Unhide modules (Click to expand)" : "Hide modules (Click to collapse)"}
                aria-label={sidebarCollapsed ? "Unhide modules" : "Hide modules"}
              >
                <MenuIcon className="w-4 h-4" />
              </button>
              {!sidebarCollapsed && (
                <span className="font-bold text-sm tracking-tight text-slate-900 truncate">Home</span>
              )}
            </div>
          </div>

          {/* Section: PUBLIC / WORKSPACE */}
          <div className="space-y-3">
            {/* Always accessible Home / Dashboard pill */}
            <nav className={sidebarCollapsed ? 'space-y-1' : 'space-y-0.5'}>
              <NavLink
                to="/dashboard"
                className={navLinkClass}
                title={sidebarCollapsed ? "Home" : undefined}
              >
                <Home className="w-4 h-4 text-slate-500 group-hover:text-slate-900 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">Home</span>}
              </NavLink>
            </nav>

            {/* DYNAMIC HIERARCHICAL PARENT MODULE ACCORDIONS */}
            {/* Parent Module ONLY renders if user has permission to at least ONE child module */}
            {HIERARCHICAL_MODULES.map(parent => {
              // Dynamic visibility check:
              const hasAccessToParent = canViewParent ? canViewParent(parent.id) : true;
              if (!hasAccessToParent) return null;

              // Filter authorized child modules
              const allowedChildren = parent.children.filter(c => canAccess(c.id, 'view') || (c.alias && canAccess(c.alias, 'view')));
              if (allowedChildren.length === 0) return null;

              const isExpanded = expandedParents[parent.id] !== false;
              const ParentIcon = ICON_MAP[parent.icon] || Grid;

              return (
                <div key={parent.id} className="pt-1">
                  {!sidebarCollapsed ? (
                    <div
                      onClick={() => toggleParent(parent.id)}
                      className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase text-slate-400 hover:text-slate-700 tracking-wider cursor-pointer select-none transition-colors group"
                      title={isExpanded ? `Collapse ${parent.name}` : `Expand ${parent.name}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ParentIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        <span>{parent.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded font-normal">
                          {allowedChildren.length}
                        </span>
                      </div>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isExpanded ? '' : '-rotate-90'}`} />
                    </div>
                  ) : (
                    <div className="w-full h-px bg-slate-200 my-1" title={parent.name} />
                  )}

                  {(sidebarCollapsed || isExpanded) && (
                    <nav className={`mt-1 ${sidebarCollapsed ? 'space-y-1' : 'space-y-0.5'}`}>
                      {allowedChildren.map(child => {
                        const ChildIcon = ICON_MAP[child.icon] || ICON_MAP[parent.icon] || Grid;
                        return (
                          <NavLink
                            key={child.id}
                            to={child.route}
                            className={navLinkClass}
                            title={sidebarCollapsed ? `${parent.name} → ${child.name}` : undefined}
                          >
                            <ChildIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-900 shrink-0" />
                            {!sidebarCollapsed && <span className="truncate">{child.name}</span>}
                          </NavLink>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom user mode indicator */}
          <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {sidebarCollapsed ? (
              <div 
                className="flex justify-center py-1 cursor-default" 
                title={`Role: ${user?.roleName || user?.role || 'Staff'}`}
              >
                <ShieldCheck className="w-4 h-4 text-slate-400 hover:text-slate-700 transition-colors" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>Role:</span>
                <span className="font-semibold text-slate-800 uppercase">{user?.roleName || user?.role || 'Staff'}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace Content Area */}
        <main className="flex-1 overflow-y-auto pb-12">
          <PageErrorBoundary routeKey={location.pathname}>
            <Outlet context={{ activeBranchId, isBranchSwitching }} />
          </PageErrorBoundary>
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 bg-white h-full flex flex-col p-4 shadow-xl z-10 overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="font-bold text-sm text-slate-900">ServeFlow</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-0.5 flex-1" onClick={() => setMobileMenuOpen(false)}>
              {canAccess('dashboard') && <NavLink to="/dashboard" className={navLinkClass}>Home</NavLink>}
              {canAccess('pos') && <NavLink to="/pos" className={navLinkClass}>Point of Sale</NavLink>}
              {canAccess('orders') && <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>}
              {canAccess('kot') && <NavLink to="/kot" className={navLinkClass}>Kitchen (KOT)</NavLink>}
              {canAccess('tables') && <NavLink to="/tables" className={navLinkClass}>Dining Tables</NavLink>}
              {canAccess('menu') && <NavLink to="/menu" className={navLinkClass}>Menu & Catalog</NavLink>}
              {canAccess('inventory') && <NavLink to="/inventory" className={navLinkClass}>Stock & Inventory</NavLink>}
              {canAccess('purchases') && <NavLink to="/purchases" className={navLinkClass}>Purchases</NavLink>}
              {canAccess('suppliers') && <NavLink to="/suppliers" className={navLinkClass}>Suppliers</NavLink>}
              {canAccess('customers') && <NavLink to="/customers" className={navLinkClass}>CRM & Customers</NavLink>}
              {canAccess('expenses') && <NavLink to="/expenses" className={navLinkClass}>Expenses</NavLink>}
              {canAccess('reports') && <NavLink to="/reports" className={navLinkClass}>Reports & Analytics</NavLink>}
              {canAccess('erpUsers') && <NavLink to="/erp/users" className={navLinkClass}>Users</NavLink>}
              {canAccess('branches') && <NavLink to="/branches" className={navLinkClass}>Branches</NavLink>}
              {canAccess('roles') && <NavLink to="/roles" className={navLinkClass}>Roles & RBAC</NavLink>}
              {canAccess('subscription') && <NavLink to="/subscription" className={navLinkClass}>Subscription</NavLink>}
              {canAccess('settings') && <NavLink to="/settings" className={navLinkClass}>Settings</NavLink>}
              {canAccess('support') && <NavLink to="/support" className={navLinkClass}>Support Desk</NavLink>}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 p-2 text-xs text-rose-600 hover:bg-rose-50 rounded"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
