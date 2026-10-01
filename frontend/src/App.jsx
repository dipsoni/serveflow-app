import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Public SaaS Landing & Registration
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import QRMenuPage from './pages/QRMenuPage';
import NotFoundPage from './pages/NotFoundPage';

// Super Admin Platform
import AdminLayout from './layouts/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminRestaurantsPage from './pages/admin/AdminRestaurantsPage';
import AdminPlansPage from './pages/admin/AdminPlansPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminLeadsPage from './pages/admin/AdminLeadsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminBranchesPage from './pages/admin/AdminBranchesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

// Restaurant Owner & Staff Modules
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BranchesPage from './pages/BranchesPage';
import SubscriptionPage from './pages/SubscriptionPage';
import RolesPage from './pages/RolesPage';
import RestaurantOnboardingPage from './pages/RestaurantOnboardingPage';
import SupportPage from './pages/SupportPage';
import POSPage from './pages/POSPage';
import OrdersPage from './pages/OrdersPage';
import KOTPage from './pages/KOTPage';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import InventoryPage from './pages/InventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import NewPurchaseOrderPage from './pages/NewPurchaseOrderPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import EmployeesPage from './pages/EmployeesPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ERPUserCanvasPage from './pages/ERPUserCanvasPage';
import RecipesPage from './pages/RecipesPage';
import RecipeFormPage from './pages/RecipeFormPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import AccountsPage from './pages/AccountsPage';

// Protected Route Component for Restaurant Staff
function ProtectedRoute({ children, moduleName }) {
  const { isAuthenticated, loading, canAccess, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kitchen role defaults directly to KOT
  if (user?.role === 'kitchen' && moduleName && moduleName !== 'kot' && moduleName !== 'inventory') {
    return <Navigate to="/kot" replace />;
  }

  if (moduleName && !canAccess(moduleName)) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-6">
        <div className="max-w-md w-full bg-white border border-rose-100 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Access Denied</h2>
          <p className="text-xs text-slate-500 mb-5">
            You don't have permission to access this module.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-600 text-left mb-5 space-y-1">
            <p><span className="text-slate-400">User:</span> {user?.name || user?.email}</p>
            <p><span className="text-slate-400">Required Module:</span> {moduleName}</p>
            <p><span className="text-slate-400">Security:</span> Direct URL Protection Enforced</p>
          </div>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}

// Protected Route Component for Super Admin Platform Owner
function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* 1. PUBLIC SAAS MARKETING & ONBOARDING ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/super-admin/login" element={<AdminLoginPage />} />

            {/* Public QR Menus (Contactless Table Ordering) */}
            <Route path="/menu/preview/:slug" element={<QRMenuPage />} />
            <Route path="/menu/:restaurantId/:branchId/:tableId" element={<QRMenuPage />} />
            <Route path="/public-menu/:restaurantId/:branchId/:tableId" element={<QRMenuPage />} />

            {/* 2. SUPER ADMIN SAAS PLATFORM CONSOLE */}
            <Route
              path="/super-admin"
              element={
                <SuperAdminRoute>
                  <AdminLayout />
                </SuperAdminRoute>
              }
            >
              <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="restaurants" element={<AdminRestaurantsPage />} />
              <Route path="plans" element={<AdminPlansPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="branches" element={<AdminBranchesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            {/* 3. RESTAURANT OWNER & STAFF WORKSPACE */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<ProtectedRoute moduleName="dashboard"><DashboardPage /></ProtectedRoute>} />
              <Route path="/branches" element={<ProtectedRoute moduleName="branches"><BranchesPage /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute moduleName="subscription"><SubscriptionPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute moduleName="subscription"><SubscriptionPage /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute moduleName="roles"><RolesPage /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><RestaurantOnboardingPage /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
              
              <Route path="/pos" element={<ProtectedRoute moduleName="pos"><POSPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute moduleName="orders"><OrdersPage /></ProtectedRoute>} />
              <Route path="/kot" element={<ProtectedRoute moduleName="kot"><KOTPage /></ProtectedRoute>} />
              <Route path="/tables" element={<ProtectedRoute moduleName="tables"><TablesPage /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute moduleName="menu"><MenuPage /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute moduleName="recipes"><RecipesPage /></ProtectedRoute>} />
              <Route path="/recipes/new" element={<ProtectedRoute moduleName="recipes"><RecipeFormPage /></ProtectedRoute>} />
              <Route path="/recipes/:id" element={<ProtectedRoute moduleName="recipes"><RecipeDetailPage /></ProtectedRoute>} />
              <Route path="/recipes/:id/edit" element={<ProtectedRoute moduleName="recipes"><RecipeFormPage /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute moduleName="inventory"><InventoryPage /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute moduleName="purchases"><PurchasesPage /></ProtectedRoute>} />
              <Route path="/purchases/new" element={<ProtectedRoute moduleName="purchases"><NewPurchaseOrderPage /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute moduleName="suppliers"><SuppliersPage /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute moduleName="customers"><CustomersPage /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute moduleName="employees"><EmployeesPage /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute moduleName="expenses"><ExpensesPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute moduleName="reports"><ReportsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute moduleName="settings"><SettingsPage /></ProtectedRoute>} />
              <Route path="/erp/users" element={<ProtectedRoute moduleName="erpUsers"><ERPUserCanvasPage /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute moduleName="erpUsers"><ERPUserCanvasPage /></ProtectedRoute>} />
              <Route path="/desk/users" element={<ProtectedRoute moduleName="erpUsers"><ERPUserCanvasPage /></ProtectedRoute>} />

              {/* Accounts Parent & Child Module Protected Routes */}
              <Route path="/accounts" element={<ProtectedRoute moduleName="accounts_dashboard"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/dashboard" element={<ProtectedRoute moduleName="accounts_dashboard"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/sales" element={<ProtectedRoute moduleName="sales"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/purchase" element={<ProtectedRoute moduleName="purchase"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/expenses" element={<ProtectedRoute moduleName="expenses"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/receivables" element={<ProtectedRoute moduleName="receivables"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/payables" element={<ProtectedRoute moduleName="payables"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/cash-bank" element={<ProtectedRoute moduleName="cash_bank"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/ledger" element={<ProtectedRoute moduleName="ledger"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/journal" element={<ProtectedRoute moduleName="journal_entries"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/reconciliation" element={<ProtectedRoute moduleName="reconciliation"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/tax" element={<ProtectedRoute moduleName="gst_tax"><AccountsPage /></ProtectedRoute>} />
              <Route path="/accounts/reports" element={<ProtectedRoute moduleName="reports"><AccountsPage /></ProtectedRoute>} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
