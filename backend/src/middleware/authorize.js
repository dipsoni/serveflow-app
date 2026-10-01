// middleware/authorize.js
const { getParentModuleId, HIERARCHICAL_MODULES } = require('../config/moduleRegistry');

/**
 * Enterprise Multi-Tenant & Branch Scope Authorization Middleware
 * Enforces strict Company Isolation (Cross-company access forbidden),
 * Granular Role Permission checks, and Decoupled Spatial Branch Scope validation.
 */
const enforceTenantAndBranch = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Populated from verified JWT session
      if (!user) {
        return res.status(401).json({ error: "Unauthenticated" });
      }

      // 1. Validate Company Isolation
      const requestedCompanyId = req.headers['x-company-id'] || req.query.companyId || req.body?.companyId;
      if (requestedCompanyId && requestedCompanyId !== user.companyId) {
        return res.status(403).json({ error: "Cross-company access strictly forbidden." });
      }

      // 2. Validate Role Permission
      if (requiredPermission) {
        const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
        const hasPermission = userPermissions.includes(requiredPermission) || userPermissions.includes('*');
        if (!hasPermission) {
          return res.status(403).json({ error: `Missing permission: ${requiredPermission}` });
        }
      }

      // 3. Validate Branch Scope
      const requestedBranchId = req.headers['x-branch-id'] || req.query.branchId || req.body?.branchId;
      if (requestedBranchId && requestedBranchId !== 'ALL') {
        const assignedBranches = Array.isArray(user.assignedBranchIds) ? user.assignedBranchIds : [];
        const hasBranchAccess = user.isAllBranchesAllowed || assignedBranches.includes(requestedBranchId);
        if (!hasBranchAccess) {
          return res.status(403).json({ error: `Access to branch ${requestedBranchId} is denied.` });
        }
      }

      // 4. Inject validated tenant boundaries into the request scope
      const assigned = Array.isArray(user.assignedBranchIds) ? user.assignedBranchIds : [];
      req.scope = {
        companyId: user.companyId,
        allowedBranches: user.isAllBranchesAllowed ? null : assigned,
        activeBranch: requestedBranchId || (user.isAllBranchesAllowed ? 'ALL' : (assigned.length > 0 ? assigned[0] : 'ALL'))
      };

      next();
    } catch (err) {
      return res.status(500).json({ error: "Security enforcement failure", details: err.message });
    }
  };
};

/**
 * Hierarchical Module & Action Access Enforcement Middleware
 *
 * Checks:
 * 1. Authenticated user identity
 * 2. Tenant / company isolation
 * 3. Branch access validation
 * 4. Parent module access (user must have at least one allowed child under the parent)
 * 5. Child module authorization (user.allowed_modules or user override)
 * 6. Action permission (view, create, edit, delete, approve, export)
 * 7. User-specific explicit overrides (denied_permissions override role permissions)
 *
 * @param {string} childModuleId e.g. 'ledger', 'sales', 'expenses', 'purchases'
 * @param {string} action e.g. 'view', 'create', 'edit', 'delete', 'approve', 'export'
 */
const enforceModuleAccess = (childModuleId, action = 'view') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthenticated" });
      }

      // Super admin platform user always bypasses tenant-level module restrictions
      if (user.role === 'super_admin' || user.is_super_admin) {
        return next();
      }

      // 1. Branch Authorization Check
      const requestedBranchId = req.headers['x-branch-id'] || req.query.branchId || req.body?.branchId;
      if (requestedBranchId && requestedBranchId !== 'ALL') {
        const assignedBranches = Array.isArray(user.assignedBranchIds) ? user.assignedBranchIds : [];
        const hasBranchAccess = user.isAllBranchesAllowed || assignedBranches.includes(requestedBranchId);
        if (!hasBranchAccess) {
          return res.status(403).json({
            error: `Access to branch ${requestedBranchId} is denied for user ${user.name || user.email}.`
          });
        }
      }

      // 2. Parent & Child Module Check
      const parentId = getParentModuleId(childModuleId);
      const allowedModules = user.allowed_modules || user.allowedModules || [];

      // Check if user has explicit denial for this action or module
      const deniedPermissions = Array.isArray(user.denied_permissions) ? user.denied_permissions : [];
      const permissionKey = `${childModuleId}.${action}`;
      const parentPermissionKey = parentId ? `${parentId}.${childModuleId}.${action}` : permissionKey;

      if (deniedPermissions.includes(permissionKey) || deniedPermissions.includes(parentPermissionKey) || deniedPermissions.includes(childModuleId)) {
        return res.status(403).json({
          error: "You don't have permission to access this module.",
          details: `User override explicitly denied ${permissionKey}`,
          moduleId: childModuleId,
          parentId,
          action
        });
      }

      // Owner role has default broad access unless explicitly denied
      if (user.role === 'owner' || user.roleId === 'role-sysadmin') {
        return next();
      }

      // Check if child module (or its alias) is in user's allowed_modules
      const isModuleAllowed = Array.isArray(allowedModules) && (
        allowedModules.includes(childModuleId) ||
        (parentId && allowedModules.includes(`${parentId}.${childModuleId}`))
      );

      if (!isModuleAllowed) {
        return res.status(403).json({
          error: "You don't have permission to access this module.",
          details: `Module '${childModuleId}' is not assigned to user`,
          moduleId: childModuleId,
          parentId,
          action
        });
      }

      // 3. Action-Level Security Verification
      // Check user-specific action permissions or role-based action permissions
      const userActionPermissions = user.action_permissions || user.user_permissions || {};
      const moduleActions = userActionPermissions[childModuleId] || userActionPermissions[`${parentId}.${childModuleId}`];

      if (Array.isArray(moduleActions) && moduleActions.length > 0) {
        // Explicit action permissions are defined for this user
        if (!moduleActions.includes(action) && !moduleActions.includes('*')) {
          return res.status(403).json({
            error: `You do not have permission to '${action}' in ${childModuleId}.`,
            details: `Action '${action}' not allowed on module '${childModuleId}'`,
            moduleId: childModuleId,
            action
          });
        }
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: "Authorization verification failure", details: err.message });
    }
  };
};

module.exports = {
  enforceTenantAndBranch,
  enforceModuleAccess
};
