const jwt = require('jsonwebtoken');
const DataService = require('../services/dataService');
const { enforceTenantAndBranch } = require('./authorize');

const JWT_SECRET = process.env.JWT_SECRET || 'serveflow_super_secret_jwt_key_2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    if (decoded.role === 'super_admin' || decoded.is_super_admin) {
      const admin = await DataService.getSuperAdmin();
      if (admin && admin.id === decoded.id) {
        user = { ...admin, role: 'super_admin', is_super_admin: true, isAllBranchesAllowed: true };
      }
    } else {
      user = await DataService.getUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found or session expired.' });
    }

    req.user = user;
    req.restaurantId = user.restaurant_id || 'rest-urban-spice-01';

    // Inject default scope
    const requestedCompanyId = req.headers['x-company-id'] || req.query.companyId || req.body?.companyId;
    const requestedBranchId = req.headers['x-branch-id'] || req.query.branchId || req.body?.branchId;

    req.scope = {
      companyId: user.companyId || 'comp-abc-foods',
      allowedBranches: user.isAllBranchesAllowed ? null : (user.assignedBranchIds || []),
      activeBranch: requestedBranchId || (user.isAllBranchesAllowed ? 'ALL' : (user.assignedBranchIds ? user.assignedBranchIds[0] : null))
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || (!req.user.is_super_admin && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Forbidden: Super Admin platform privileges required.' });
  }
  next();
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Super Admin or Owner has access to everything
    if (req.user.role === 'super_admin' || req.user.is_super_admin || req.user.role === 'owner') {
      return next();
    }

    const userRoles = [req.user.role, req.user.roleId, req.user.role_id].filter(Boolean);
    const hasRole = roles.some(r => userRoles.some(ur => ur.toLowerCase().includes(r.toLowerCase())));

    if (roles.length > 0 && !hasRole) {
      return res.status(403).json({
        message: `Forbidden: role '${req.user.role}' does not have permission to perform this action.`
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireSuperAdmin,
  enforceTenantAndBranch,
  enforceModuleAccess: require('./authorize').enforceModuleAccess,
  JWT_SECRET
};

