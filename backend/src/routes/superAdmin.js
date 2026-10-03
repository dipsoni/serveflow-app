const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to ensure user is super_admin
const enforceSuperAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dev_key');
    if (decoded.role !== 'super_admin' && !decoded.is_super_admin) {
      return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const dataService = require('../services/dataService');

// --- SUPER ADMIN AUTH ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@serveflow.com' && password === 'admin123') {
    const token = jwt.sign(
      { 
        id: 'sa-1', 
        name: 'Super Admin', 
        email, 
        role: 'super_admin',
        is_super_admin: true 
      },
      process.env.JWT_SECRET || 'super_secret_dev_key',
      { expiresIn: '24h' }
    );
    return res.json({ token, user: { id: 'sa-1', name: 'Super Admin', email, role: 'super_admin' } });
  }
  res.status(401).json({ error: 'Invalid super admin credentials' });
});

// --- DASHBOARD ---
router.get('/dashboard', enforceSuperAdmin, async (req, res) => {
  try {
    const restaurants = dataService.getAll('companies');
    const branches = dataService.getAll('branches');
    const users = dataService.getAll('users');
    
    const stats = {
      totalRestaurants: restaurants.length || 128,
      activeRestaurants: restaurants.filter(r => r.status === 'Active').length || 112,
      trialRestaurants: restaurants.filter(r => r.status === 'Trial').length || 10,
      inactiveRestaurants: restaurants.filter(r => r.status !== 'Active' && r.status !== 'Trial').length || 6,
      totalBranches: branches.length || 286,
      totalUsers: users.length || 1420,
      ordersToday: 5432,
      ordersMonth: 142300
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RESTAURANTS (COMPANIES) ---
router.get('/restaurants', enforceSuperAdmin, async (req, res) => {
  try {
    const mockRestaurants = [
      { id: 'c1', name: 'Urban Spice Restaurant', owner: 'Rajesh Patel', phone: '+91 9876543210', email: 'rajesh@urbanspice.com', branches: 4, users: 15, status: 'Active', created_at: '2025-01-15T00:00:00.000Z', plan: 'Professional' },
      { id: 'c2', name: 'Royal Dine', owner: 'Rahul Mehta', phone: '+91 9123456789', email: 'rahul@royaldine.in', branches: 2, users: 8, status: 'Trial', created_at: '2026-08-01T00:00:00.000Z', plan: 'Trial' },
      { id: 'c3', name: 'Burger Point', owner: 'Amit Shah', phone: '+91 9988776655', email: 'amit@burgerpoint.com', branches: 10, users: 42, status: 'Active', created_at: '2024-11-20T00:00:00.000Z', plan: 'Enterprise' },
      { id: 'c4', name: 'Cafe Mocha', owner: 'Priya Sharma', phone: '+91 9876512345', email: 'priya@cafemocha.in', branches: 1, users: 3, status: 'Inactive', created_at: '2025-06-10T00:00:00.000Z', plan: 'Basic' }
    ];
    res.json(mockRestaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/restaurants', enforceSuperAdmin, async (req, res) => {
  const data = req.body;
  res.status(201).json({ message: 'Restaurant company created successfully', company: { id: `c${Date.now()}`, ...data, status: 'Trial' } });
});

router.get('/restaurants/:id', enforceSuperAdmin, async (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Urban Spice Restaurant',
    owner: 'Rajesh Patel',
    email: 'rajesh@urbanspice.com',
    phone: '+91 9876543210',
    gst_number: '27AADCU1234K1Z5',
    address: '123 MG Road, Mumbai, MH',
    status: 'Active',
    created_at: '2025-01-15T00:00:00.000Z',
    plan: 'Professional',
    stats: {
      branches: 4,
      users: 15,
      orders: 24500,
      sales: 12500000,
      customers: 8500
    }
  });
});

router.put('/restaurants/:id/status', enforceSuperAdmin, async (req, res) => {
  res.json({ message: `Status updated to ${req.body.status}` });
});

// --- BRANCHES OVERVIEW ---
router.get('/branches', enforceSuperAdmin, async (req, res) => {
  const mockBranches = [
    { id: 'b1', name: 'MG Road Branch', company: 'Urban Spice Restaurant', city: 'Mumbai', manager: 'Suresh Kumar', users: 5, orders: 1240, status: 'Active' },
    { id: 'b2', name: 'Andheri West', company: 'Urban Spice Restaurant', city: 'Mumbai', manager: 'Ramesh Singh', users: 4, orders: 980, status: 'Active' },
    { id: 'b3', name: 'Bandra', company: 'Urban Spice Restaurant', city: 'Mumbai', manager: 'Pooja', users: 6, orders: 1500, status: 'Active' },
    { id: 'b4', name: 'Satellite', company: 'Royal Dine', city: 'Ahmedabad', manager: 'Kiran', users: 4, orders: 320, status: 'Active' },
    { id: 'b5', name: 'Bopal', company: 'Royal Dine', city: 'Ahmedabad', manager: 'Vikram', users: 4, orders: 410, status: 'Active' }
  ];
  res.json(mockBranches);
});

// --- USERS OVERVIEW ---
router.get('/users', enforceSuperAdmin, async (req, res) => {
  const mockUsers = [
    { id: 'u1', name: 'Rajesh Patel', email: 'rajesh@urbanspice.com', company: 'Urban Spice Restaurant', role: 'Owner', branch: 'All Branches', status: 'Active', last_login: '2026-10-01T10:30:00Z' },
    { id: 'u2', name: 'Rahul Mehta', email: 'rahul@royaldine.in', company: 'Royal Dine', role: 'Owner', branch: 'All Branches', status: 'Active', last_login: '2026-10-01T09:15:00Z' },
    { id: 'u3', name: 'Suresh Kumar', email: 'suresh@urbanspice.com', company: 'Urban Spice Restaurant', role: 'Manager', branch: 'MG Road Branch', status: 'Active', last_login: '2026-10-01T08:00:00Z' },
    { id: 'u4', name: 'Pooja', email: 'pooja@urbanspice.com', company: 'Urban Spice Restaurant', role: 'Manager', branch: 'Bandra', status: 'Active', last_login: '2026-09-30T22:00:00Z' }
  ];
  res.json(mockUsers);
});

// --- AUDIT LOGS ---
router.get('/audit-logs', enforceSuperAdmin, async (req, res) => {
  const mockLogs = [
    { id: 1, admin: 'Super Admin', action: 'Plan changed to Enterprise', company: 'Burger Point', created_at: '2026-10-01T14:20:00Z' },
    { id: 2, admin: 'Super Admin', action: 'Restaurant suspended', company: 'Cafe Mocha', created_at: '2026-09-28T11:15:00Z' },
    { id: 3, admin: 'Super Admin', action: 'Restaurant created', company: 'Royal Dine', created_at: '2026-08-01T09:00:00Z' }
  ];
  res.json(mockLogs);
});

module.exports = router;
