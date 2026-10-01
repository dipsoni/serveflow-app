import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState('ALL');
  const [isBranchSwitching, setIsBranchSwitching] = useState(false);
  const branchSwitchTimerRef = useRef(null);

  // Compute active branch object and access modes
  const isAllBranchesAllowed = Boolean(user?.has_all_branch_access || user?.isAllBranchesAllowed);
  const assignedBranches = user?.branches || [];
  const assignedBranchIds = user?.assignedBranchIds || assignedBranches.map(b => b.id) || [];
  const isMultiBranchUser = isAllBranchesAllowed || assignedBranchIds.length > 1;
  const isBranchLocked = !isAllBranchesAllowed && assignedBranchIds.length === 1;

  // Active branch label
  const activeBranch = isAllBranchesAllowed && activeBranchId === 'ALL'
    ? { id: 'ALL', name: 'All Branches (Consolidated HQ)', city: 'All Regions' }
    : (assignedBranches.find(b => b.id === activeBranchId) || assignedBranches[0] || { id: 'branch-bopal', name: 'Bopal Branch', city: 'Ahmedabad' });

  // Initialize from storage or me endpoint (supporting tab-isolated sessionStorage)
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem('serveflow_token') || localStorage.getItem('serveflow_token');
      const storedUser = sessionStorage.getItem('serveflow_user') || localStorage.getItem('serveflow_user');
      const storedRest = sessionStorage.getItem('serveflow_restaurant') || localStorage.getItem('serveflow_restaurant');
      const storedBranchId = sessionStorage.getItem('serveflow_active_branch_id') || localStorage.getItem('serveflow_active_branch_id');

      if (storedToken) {
        // Ensure this tab's sessionStorage has the token
        sessionStorage.setItem('serveflow_token', storedToken);

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            sessionStorage.setItem('serveflow_user', storedUser);
            if (storedBranchId) {
              setActiveBranchId(storedBranchId);
              sessionStorage.setItem('serveflow_active_branch_id', storedBranchId);
            } else if (parsedUser.has_all_branch_access) {
              setActiveBranchId('ALL');
              sessionStorage.setItem('serveflow_active_branch_id', 'ALL');
            } else if (parsedUser.assignedBranchIds && parsedUser.assignedBranchIds.length > 0) {
              setActiveBranchId(parsedUser.assignedBranchIds[0]);
              sessionStorage.setItem('serveflow_active_branch_id', parsedUser.assignedBranchIds[0]);
            }
          } catch (e) {
            console.warn('Error parsing stored user', e);
          }
        }
        if (storedRest) {
          try {
            setRestaurant(JSON.parse(storedRest));
            sessionStorage.setItem('serveflow_restaurant', storedRest);
          } catch (e) {}
        }

        try {
          const res = await api.get('/auth/me');
          const userData = res.data.user;
          setUser(userData);
          setRestaurant(res.data.restaurant);
          sessionStorage.setItem('serveflow_user', JSON.stringify(userData));
          sessionStorage.setItem('serveflow_restaurant', JSON.stringify(res.data.restaurant));
          if (userData.companyId) {
            sessionStorage.setItem('serveflow_company_id', userData.companyId);
          }

          // If branch is locked, enforce active branch to designated single branch
          if (!userData.has_all_branch_access && userData.assignedBranchIds?.length === 1) {
            setActiveBranchId(userData.assignedBranchIds[0]);
            sessionStorage.setItem('serveflow_active_branch_id', userData.assignedBranchIds[0]);
          } else if (!storedBranchId) {
            const defaultBranch = userData.has_all_branch_access ? 'ALL' : (userData.assignedBranchIds?.[0] || 'branch-bopal');
            setActiveBranchId(defaultBranch);
            sessionStorage.setItem('serveflow_active_branch_id', defaultBranch);
          }
        } catch (e) {
          console.warn('Auth validation failed, clearing token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData, restaurant: restData } = res.data;

      // 1. Set tab-isolated sessionStorage so each tab can have its own ID/session
      sessionStorage.setItem('serveflow_token', token);
      sessionStorage.setItem('serveflow_user', JSON.stringify(userData));
      sessionStorage.setItem('serveflow_restaurant', JSON.stringify(restData));
      if (userData.companyId) {
        sessionStorage.setItem('serveflow_company_id', userData.companyId);
      }

      // 2. Also persist to localStorage for single-tab convenience
      localStorage.setItem('serveflow_token', token);
      localStorage.setItem('serveflow_user', JSON.stringify(userData));
      localStorage.setItem('serveflow_restaurant', JSON.stringify(restData));
      if (userData.companyId) {
        localStorage.setItem('serveflow_company_id', userData.companyId);
      }

      // Determine initial active branch
      let initialBranch = 'ALL';
      if (!userData.has_all_branch_access && userData.assignedBranchIds?.length > 0) {
        initialBranch = userData.assignedBranchIds[0];
      }
      setActiveBranchId(initialBranch);
      sessionStorage.setItem('serveflow_active_branch_id', initialBranch);
      localStorage.setItem('serveflow_active_branch_id', initialBranch);

      setUser(userData);
      setRestaurant(restData);
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const superAdminLogin = async (email, password) => {
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      const { token, admin } = res.data;

      const adminUser = { ...admin, role: 'super_admin', is_super_admin: true };
      sessionStorage.setItem('serveflow_token', token);
      sessionStorage.setItem('serveflow_user', JSON.stringify(adminUser));
      localStorage.setItem('serveflow_token', token);
      localStorage.setItem('serveflow_user', JSON.stringify(adminUser));
      setUser(adminUser);
      return { success: true, admin: adminUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Super Admin login failed.';
      return { success: false, message };
    }
  };

  const setSession = (token, userData, restData) => {
    sessionStorage.setItem('serveflow_token', token);
    sessionStorage.setItem('serveflow_user', JSON.stringify(userData));
    if (restData) sessionStorage.setItem('serveflow_restaurant', JSON.stringify(restData));
    if (userData.companyId) sessionStorage.setItem('serveflow_company_id', userData.companyId);

    localStorage.setItem('serveflow_token', token);
    localStorage.setItem('serveflow_user', JSON.stringify(userData));
    if (restData) localStorage.setItem('serveflow_restaurant', JSON.stringify(restData));
    if (userData.companyId) localStorage.setItem('serveflow_company_id', userData.companyId);

    let initialBranch = 'ALL';
    if (!userData.has_all_branch_access && userData.assignedBranchIds?.length > 0) {
      initialBranch = userData.assignedBranchIds[0];
    }
    setActiveBranchId(initialBranch);
    sessionStorage.setItem('serveflow_active_branch_id', initialBranch);
    localStorage.setItem('serveflow_active_branch_id', initialBranch);

    setUser(userData);
    if (restData) setRestaurant(restData);
  };

  const logout = () => {
    sessionStorage.removeItem('serveflow_token');
    sessionStorage.removeItem('serveflow_user');
    sessionStorage.removeItem('serveflow_restaurant');
    sessionStorage.removeItem('serveflow_company_id');
    sessionStorage.removeItem('serveflow_active_branch_id');

    localStorage.removeItem('serveflow_token');
    localStorage.removeItem('serveflow_user');
    localStorage.removeItem('serveflow_restaurant');
    localStorage.removeItem('serveflow_company_id');
    localStorage.removeItem('serveflow_active_branch_id');

    setUser(null);
    setRestaurant(null);
    setActiveBranchId('ALL');
  };

  const switchBranch = (branchId) => {
    // If user is locked to a single branch, prevent switching to other branches
    if (isBranchLocked && branchId !== assignedBranchIds[0]) {
      console.warn(`User branch is locked to ${assignedBranchIds[0]}`);
      return false;
    }
    // Don't re-switch to the same branch
    if (branchId === activeBranchId) return true;

    // Set switching flag — this lets all branch-sensitive pages show loading state
    setIsBranchSwitching(true);

    // Clear any previous switch timer
    if (branchSwitchTimerRef.current) clearTimeout(branchSwitchTimerRef.current);

    // Update the active branch immediately (triggers refetches via useEffect deps)
    setActiveBranchId(branchId);
    localStorage.setItem('serveflow_active_branch_id', branchId);
    sessionStorage.setItem('serveflow_active_branch_id', branchId);

    // Clear the switching flag after a short delay giving pages time to reset
    branchSwitchTimerRef.current = setTimeout(() => {
      setIsBranchSwitching(false);
    }, 600);

    return true;
  };

  const updateCurrentUser = (updatedUserData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('serveflow_user', JSON.stringify(merged));
      return merged;
    });
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.is_super_admin) return true;
    if (user.role === 'owner' || user.roleId === 'role-sysadmin') return true;
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    return perms.includes('*') || perms.includes(permissionKey);
  };

  const canAccess = (moduleName, action = 'view') => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.is_super_admin) return true;

    // Check explicit denied permissions override (user-specific override takes top precedence!)
    const denied = Array.isArray(user.denied_permissions) ? user.denied_permissions : [];
    if (denied.includes(moduleName) || denied.includes(`${moduleName}.${action}`)) {
      return false;
    }

    if (user.role === 'owner' || user.roleId === 'role-sysadmin') return true;

    // 1. Strict Allowed Modules Enforcement (Frappe/ERPNext Module Profile)
    const allowed = user.allowed_modules || user.allowedModules;
    if (Array.isArray(allowed)) {
      if (moduleName === 'dashboard' || moduleName === 'home') return true;
      
      // Alias normalization
      const aliases = {
        inventory: 'stock',
        stock: 'inventory',
        erpUsers: 'users',
        users: 'erpUsers',
        tax: 'gst_tax',
        gst_tax: 'tax',
        journal: 'journal_entries',
        journal_entries: 'journal'
      };

      const hasMod = allowed.includes(moduleName) || (aliases[moduleName] && allowed.includes(aliases[moduleName]));
      if (!hasMod) return false;

      // Check action-level override if present
      const actionPerms = user.action_permissions || user.user_permissions;
      if (actionPerms && typeof actionPerms === 'object') {
        const modActions = actionPerms[moduleName] || (aliases[moduleName] && actionPerms[aliases[moduleName]]);
        if (Array.isArray(modActions) && modActions.length > 0) {
          return modActions.includes(action) || modActions.includes('*');
        }
      }

      return true;
    }

    // 2. Granular permission tree mapping fallback
    const moduleMap = {
      dashboard: 'dashboard.view',
      pos: 'pos.view',
      orders: 'orders.view',
      kot: 'kot.view',
      tables: 'tables.view',
      menu: 'menu.view',
      recipes: 'menu.view',
      inventory: 'inventory.view',
      stock: 'inventory.view',
      purchases: 'purchases.view',
      suppliers: 'purchases.view',
      customers: 'pos.view',
      employees: 'users.manage',
      erpUsers: 'users.manage',
      users: 'users.manage',
      branches: 'dashboard.view',
      subscription: 'settings.view',
      roles: 'users.manage',
      expenses: 'expenses.view',
      reports: 'reports.view',
      settings: 'settings.view',
      support: 'dashboard.view',
      onboarding: 'settings.view',
      // Accounts module fallbacks
      accounts_dashboard: 'dashboard.view',
      sales: 'orders.view',
      purchase: 'purchases.view',
      receivables: 'reports.view_financial',
      payables: 'purchases.view',
      cash_bank: 'dashboard.view',
      ledger: 'reports.view_financial',
      journal_entries: 'reports.view_financial',
      reconciliation: 'reports.view_financial',
      gst_tax: 'reports.view_financial'
    };

    const permKey = moduleMap[moduleName];
    if (permKey && hasPermission(permKey)) return true;

    // 3. Fallback role permissions
    const rolePermissions = {
      manager: ['dashboard', 'pos', 'orders', 'kot', 'tables', 'menu', 'recipes', 'inventory', 'purchases', 'suppliers', 'customers', 'employees', 'erpUsers', 'branches', 'subscription', 'roles', 'expenses', 'reports', 'settings', 'support', 'accounts_dashboard', 'sales', 'purchase', 'receivables', 'payables', 'cash_bank', 'ledger', 'journal_entries', 'reconciliation', 'gst_tax'],
      cashier: ['pos', 'orders', 'tables', 'customers'],
      waiter: ['pos', 'tables', 'orders'],
      kitchen: ['kot', 'inventory', 'recipes']
    };

    const fallbackList = rolePermissions[user.role] || [];
    return fallbackList.includes(moduleName);
  };

  /**
   * Checks if user has permission for a specific action within a module
   */
  const canAccessAction = (moduleName, action = 'view') => {
    return canAccess(moduleName, action);
  };

  /**
   * Dynamic Parent Module Visibility:
   * Returns true ONLY if user has access to at least 1 child module under this parent
   */
  const canViewParent = (parentModuleKey) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.is_super_admin || user.role === 'owner') return true;

    const parentChildMap = {
      operations: ['orders', 'kot', 'pos', 'tables', 'serving'],
      inventory: ['stock', 'inventory', 'ingredients', 'recipes', 'purchases', 'suppliers', 'stock_ledger'],
      accounts: ['accounts_dashboard', 'sales', 'purchase', 'expenses', 'receivables', 'payables', 'cash_bank', 'ledger', 'journal_entries', 'journal', 'reconciliation', 'gst_tax', 'tax', 'reports'],
      administration: ['users', 'erpUsers', 'roles', 'permissions', 'branches', 'settings', 'subscription']
    };

    const children = parentChildMap[parentModuleKey] || [];
    return children.some(c => canAccess(c, 'view'));
  };

  const isSuperAdmin = user?.role === 'super_admin' || Boolean(user?.is_super_admin);

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        setRestaurant,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin,
        login,
        superAdminLogin,
        setSession,
        logout,
        activeBranchId,
        activeBranch,
        assignedBranches,
        isMultiBranchUser,
        isBranchLocked,
        isAllBranchesAllowed,
        isBranchSwitching,
        switchBranch,
        hasPermission,
        canAccess,
        canAccessAction,
        canViewParent,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
