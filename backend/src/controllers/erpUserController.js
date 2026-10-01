// backend/src/controllers/erpUserController.js
const DataService = require('../services/dataService');

const ERPUserController = {
  // GET /api/erp/users
  async getUsers(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const users = await DataService.getERPUsers(companyId);
      return res.json({
        success: true,
        companyId,
        count: users.length,
        users
      });
    } catch (err) {
      console.error('Error fetching ERP users:', err);
      return res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
  },

  // GET /api/erp/users/:id
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await DataService.getERPUserById(id);
      if (!user) {
        return res.status(404).json({ error: `User with ID ${id} not found` });
      }

      // Hard tenant isolation: prevent viewing cross-company user
      if (req.scope?.companyId && user.companyId !== req.scope.companyId) {
        return res.status(403).json({ error: 'Cross-company access strictly forbidden.' });
      }

      return res.json({ success: true, user });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch user', details: err.message });
    }
  },

  // PUT /api/erp/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existing = await DataService.getERPUserById(id);
      if (!existing) {
        return res.status(404).json({ error: `User with ID ${id} not found` });
      }

      // Hard tenant isolation
      if (req.scope?.companyId && existing.companyId !== req.scope.companyId) {
        return res.status(403).json({ error: 'Cross-company access strictly forbidden.' });
      }

      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '192.168.1.105';
      const auditContext = {
        userName: req.user?.name || 'Administrator',
        ip: clientIp,
        action: updates.actionName || 'USER_CONFIG_UPDATED',
        module: 'Security & Permissions Matrix',
        details: {
          updated_fields: Object.keys(updates),
          new_role: updates.role_id,
          has_all_branch_access: updates.has_all_branch_access,
          assigned_branches: updates.assignedBranchIds,
          status: updates.status
        }
      };

      const updated = await DataService.updateERPUser(id, updates, auditContext);
      return res.json({
        success: true,
        message: `User ${updated.name} updated successfully`,
        user: updated
      });
    } catch (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user', details: err.message });
    }
  },

  // POST /api/erp/users
  async createUser(req, res) {
    try {
      const payload = req.body;
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';

      if (!payload.name || !payload.email) {
        return res.status(400).json({ error: 'User name and email are required' });
      }

      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '192.168.1.105';
      const auditContext = {
        userName: req.user?.name || 'Administrator',
        ip: clientIp
      };

      const newUser = await DataService.createERPUser({ ...payload, company_id: companyId }, auditContext);
      return res.status(201).json({
        success: true,
        message: `User ${newUser.name} created successfully`,
        user: newUser
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
  },

  // POST /api/erp/users/:id/comments
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
      }

      const commentData = {
        companyId: req.scope?.companyId || req.user?.companyId || 'comp-abc-foods',
        authorId: req.user?.id || 'usr-ceo-01',
        authorName: req.user?.name ? `${req.user.name} (${req.user.roleName || 'Staff'})` : 'Aditya Vikram (CEO)',
        authorAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        content: content.trim()
      };

      const comment = await DataService.addUserComment(id, commentData);
      return res.status(201).json({ success: true, comment });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to add comment', details: err.message });
    }
  },

  // GET /api/erp/roles
  async getRoles(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const roles = await DataService.getRoles(companyId);
      const permissionGroups = DataService.getPermissionGroups();
      const moduleProfiles = DataService.getModuleProfiles();

      return res.json({
        success: true,
        roles,
        permissionGroups,
        moduleProfiles
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch roles', details: err.message });
    }
  },

  // GET /api/erp/branches
  async getBranches(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const branches = await DataService.getBranches(companyId);
      return res.json({
        success: true,
        branches
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch branches', details: err.message });
    }
  },

  // GET /api/erp/audit-logs
  async getAuditLogs(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const userId = req.query.userId || null;
      const logs = await DataService.getAuditLogs(companyId, userId);
      return res.json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
    }
  }
};

module.exports = ERPUserController;
