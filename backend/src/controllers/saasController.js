const jwt = require('jsonwebtoken');
const DataService = require('../services/dataService');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const SaaSController = {
  // 1. PUBLIC SAAS ENDPOINTS
  async getPublicPlans(req, res) {
    try {
      const plans = await DataService.getPublicPlans();
      return res.json({ plans });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async registerRestaurant(req, res) {
    try {
      const {
        businessName,
        ownerName,
        email,
        mobile,
        password,
        address,
        city,
        state,
        country,
        gstNumber,
        businessType,
        planId,
        billingCycle,
        paymentMethod
      } = req.body;

      if (!businessName || !ownerName || !email || !password) {
        return res.status(400).json({ message: 'Business name, owner name, email, and password are required' });
      }

      const result = await DataService.registerRestaurantAccount({
        businessName,
        ownerName,
        email,
        mobile,
        password,
        address,
        city,
        state,
        country,
        gstNumber,
        businessType,
        planId,
        billingCycle,
        paymentMethod
      });

      // Generate owner auth token
      const token = jwt.sign(
        {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          companyId: result.companyId
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Restaurant account registered and subscription activated successfully!',
        token,
        ...result
      });
    } catch (err) {
      console.error('Restaurant registration error:', err);
      return res.status(err.status || 500).json({ message: err.message });
    }
  },

  // 2. SUPER ADMIN AUTH & PLATFORM METRICS
  async superAdminLogin(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const admin = await DataService.superAdminLogin(email, password);
      if (!admin) {
        return res.status(401).json({ message: 'Invalid Super Admin credentials' });
      }

      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          role: 'super_admin',
          is_super_admin: true
        },
        JWT_SECRET,
        { expiresIn: '3d' }
      );

      const { password_hash, ...safeAdmin } = admin;
      return res.json({
        token,
        admin: safeAdmin,
        message: 'Super Admin authentication successful'
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAdminStats(req, res) {
    try {
      const stats = await DataService.getAdminStats();
      return res.json({ stats });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // 3. SUPER ADMIN RESTAURANTS MANAGEMENT
  async getAdminRestaurants(req, res) {
    try {
      const { search, status, planId } = req.query;
      const restaurants = await DataService.getAdminRestaurants({ search, status, planId });
      return res.json({ restaurants });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAdminRestaurantById(req, res) {
    try {
      const data = await DataService.getAdminRestaurantById(req.params.id);
      if (!data) return res.status(404).json({ message: 'Restaurant not found' });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateAdminRestaurant(req, res) {
    try {
      const updated = await DataService.updateAdminRestaurant(req.params.id, req.body);
      return res.json({ message: 'Restaurant updated successfully', restaurant: updated });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteAdminRestaurant(req, res) {
    try {
      const deleted = await DataService.deleteAdminRestaurant(req.params.id);
      return res.json({ message: 'Restaurant deleted / deactivated', restaurant: deleted });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async resetOwnerPassword(req, res) {
    try {
      const result = await DataService.resetOwnerPassword(req.params.id, req.body.newPassword);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async extendSubscription(req, res) {
    try {
      const result = await DataService.extendSubscription(req.params.id, Number(req.body.days || 30));
      return res.json({ message: 'Subscription extended successfully', ...result });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // 4. SUPER ADMIN PLANS
  async getAdminPlans(req, res) {
    try {
      const plans = await DataService.getAdminPlans();
      return res.json({ plans });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createAdminPlan(req, res) {
    try {
      const plan = await DataService.createAdminPlan(req.body);
      return res.status(201).json({ message: 'Plan created successfully', plan });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async updateAdminPlan(req, res) {
    try {
      const plan = await DataService.updateAdminPlan(req.params.id, req.body);
      return res.json({ message: 'Plan updated successfully', plan });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteAdminPlan(req, res) {
    try {
      const deleted = await DataService.deleteAdminPlan(req.params.id);
      return res.json({ message: 'Plan deleted', plan: deleted });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // 5. SUPER ADMIN SUBSCRIPTIONS & PAYMENTS
  async getAdminSubscriptions(req, res) {
    try {
      const subscriptions = await DataService.getAdminSubscriptions();
      return res.json({ subscriptions });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAdminPayments(req, res) {
    try {
      const payments = await DataService.getAdminPayments();
      return res.json({ payments });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAdminSettings(req, res) {
    try {
      const settings = await DataService.getAdminSettings();
      return res.json({ settings });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateAdminSettings(req, res) {
    try {
      const settings = await DataService.updateAdminSettings(req.body);
      return res.json({ message: 'Platform settings updated', settings });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // 6. RESTAURANT OWNER SUBSCRIPTION & BILLING
  async getRestaurantSubscription(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const data = await DataService.getRestaurantSubscription(companyId);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async upgradeRestaurantSubscription(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const result = await DataService.upgradeTenantSubscription(companyId, req.body);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // 7. RESTAURANT OWNER BRANCHES (WITH PLAN ENFORCEMENT)
  async getTenantBranches(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const branches = await DataService.getBranches(companyId);
      return res.json({ branches });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createTenantBranch(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const branch = await DataService.createTenantBranch(companyId, req.body);
      return res.status(201).json({ message: 'Branch created successfully', branch });
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message, code: err.code });
    }
  },

  async updateTenantBranch(req, res) {
    try {
      const branch = await DataService.updateTenantBranch(req.params.id, req.body);
      return res.json({ message: 'Branch updated successfully', branch });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteTenantBranch(req, res) {
    try {
      const deleted = await DataService.deleteTenantBranch(req.params.id);
      return res.json({ message: 'Branch deleted', branch: deleted });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // 8. CUSTOM ROLES & PERMISSIONS
  async getCustomRoles(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const roles = await DataService.getRoles(companyId);
      return res.json({ roles });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createCustomRole(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const role = await DataService.createCustomRole(companyId, req.body);
      return res.status(201).json({ message: 'Role created successfully', role });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async updateCustomRole(req, res) {
    try {
      const role = await DataService.updateCustomRole(req.params.id, req.body);
      return res.json({ message: 'Role updated successfully', role });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteCustomRole(req, res) {
    try {
      const deleted = await DataService.deleteCustomRole(req.params.id);
      return res.json({ message: 'Role deleted', role: deleted });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // 9. PUBLIC DEMO & SALES LEADS PIPELINE
  async createSalesLead(req, res) {
    try {
      const { restaurant_name, restaurantName, owner_name, ownerName, mobile, email } = req.body;
      const rName = restaurant_name || restaurantName;
      const oName = owner_name || ownerName;
      if (!rName || !oName || !mobile || !email) {
        return res.status(400).json({ message: 'Restaurant name, owner name, mobile number, and email are required.' });
      }

      const lead = await DataService.createSalesLead(req.body);
      return res.status(201).json({
        message: 'Demo request received! Our restaurant growth expert will reach out within 2 hours.',
        lead
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAdminLeads(req, res) {
    try {
      const { search, status } = req.query;
      const leads = await DataService.getAdminLeads({ search, status });
      return res.json({ leads });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateAdminLead(req, res) {
    try {
      const lead = await DataService.updateLead(req.params.id, req.body);
      return res.json({ message: 'Lead updated successfully', lead });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async convertAdminLead(req, res) {
    try {
      const result = await DataService.convertLeadToRestaurant(req.params.id, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // 10. SUPPORT & HELPDESK
  async getSupportTickets(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const tickets = await DataService.getSupportTickets(companyId);
      return res.json({ tickets });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async createSupportTicket(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const { subject, description } = req.body;
      if (!subject || !description) {
        return res.status(400).json({ message: 'Subject and description are required' });
      }
      const ticket = await DataService.createSupportTicket(companyId, req.body, req.user);
      return res.status(201).json({ message: 'Support ticket submitted successfully', ticket });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAdminSupportTickets(req, res) {
    try {
      const { status, priority } = req.query;
      const tickets = await DataService.getAdminSupportTickets({ status, priority });
      return res.json({ tickets });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateAdminSupportTicket(req, res) {
    try {
      const ticket = await DataService.updateAdminSupportTicket(req.params.id, req.body);
      return res.json({ message: 'Ticket updated successfully', ticket });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // 11. RESTAURANT ONBOARDING WIZARD
  async getOnboardingProgress(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const progress = await DataService.getOnboardingProgress(companyId);
      return res.json({ progress });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  async updateOnboardingStep(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const { step, data } = req.body;
      const progress = await DataService.updateOnboardingStep(companyId, { step, data });
      return res.json({ message: 'Step saved successfully', progress });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async completeOnboarding(req, res) {
    try {
      const companyId = req.scope?.companyId || req.user?.companyId || 'comp-abc-foods';
      const progress = await DataService.completeOnboarding(companyId);
      return res.json({ message: 'Onboarding completed! Welcome to ServeFlow OS.', progress });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = SaaSController;
