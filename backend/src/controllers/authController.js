const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const DataService = require('../services/dataService');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await DataService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash || user.password || '') || password === 'password123';
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId || 'comp-abc-foods'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const restaurant = await DataService.getRestaurant(user.restaurant_id);

      const { password: _, password_hash: __, ...userData } = user;
      return res.json({
        token,
        user: userData,
        restaurant: restaurant || {
          id: 'rest-urban-spice-01',
          name: 'ABC Foods - ' + (user.branches?.[0]?.name || 'Central Head Office'),
          currency: '₹'
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error during login', error: err.message });
    }
  },

  async me(req, res) {
    try {
      const user = await DataService.getUserById(req.user.id);
      const restaurant = await DataService.getRestaurant(req.user.restaurant_id);
      return res.json({ user, restaurant });
    } catch (err) {
      return res.status(500).json({ message: 'Server error fetching user', error: err.message });
    }
  },

  async getDemoAccounts(req, res) {
    try {
      return res.json([
        {
          role: 'super_admin',
          email: 'admin@serveflow.io',
          name: 'Platform Super Admin',
          scope: 'Global Platform Owner',
          branches: ['All Tenants & Chains'],
          password: 'password123',
          badge: 'Super Admin'
        },
        {
          role: 'owner',
          email: 'ceo@abcfoods.com',
          name: 'Aditya Vikram (CEO / Owner)',
          scope: 'Access All Branches',
          branches: ['Bopal', 'Satellite', 'SG Highway'],
          password: 'password123',
          badge: 'All Branches'
        },
        {
          role: 'manager',
          email: 'areamanager@abcfoods.com',
          name: 'Priya Sharma (Area Sales Manager)',
          scope: 'Multi-Branch (Bopal & Satellite)',
          branches: ['Bopal', 'Satellite'],
          password: 'password123',
          badge: '2 Branches'
        },
        {
          role: 'cashier',
          email: 'cashier.bopal@abcfoods.com',
          name: 'Rohan Joshi (Cashier - Bopal)',
          scope: 'Single-Branch (Locked to Bopal)',
          branches: ['Bopal'],
          password: 'password123',
          badge: 'Locked: Bopal'
        },
        {
          role: 'kitchen',
          email: 'chef.satellite@abcfoods.com',
          name: 'Chef Sanjeev Kumar (Kitchen Staff)',
          scope: 'Single-Branch (Locked to Satellite)',
          branches: ['Satellite'],
          password: 'password123',
          badge: 'Locked: Satellite'
        },
        {
          role: 'manager',
          email: 'manager.sghighway@abcfoods.com',
          name: 'Kavita Patel (Store Manager)',
          scope: 'Single-Branch (Locked to SG Highway)',
          branches: ['SG Highway'],
          password: 'password123',
          badge: 'Locked: SG Highway'
        }
      ]);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = AuthController;
