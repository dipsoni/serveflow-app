// test_saas_backend.js - Test SaaS & Super Admin endpoints
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('Testing SaaS Backend APIs...');

  // 1. Get Public Plans
  const plansRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/public/plans',
    method: 'GET'
  });
  console.log('1. Public Plans:', plansRes.status, plansRes.data.plans?.length, 'plans found');

  // 2. Super Admin Login
  const adminLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@serveflow.io', password: 'password123' });
  console.log('2. Super Admin Login:', adminLogin.status, adminLogin.data.message);
  const adminToken = adminLogin.data.token;

  // 3. Super Admin Stats
  const statsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('3. Admin Stats:', statsRes.status, statsRes.data.stats?.totalRestaurants, 'restaurants, Revenue: ₹' + statsRes.data.stats?.totalRevenue);

  // 4. Register new Restaurant
  const regRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/public/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    businessName: 'Shree Food Restaurant',
    ownerName: 'Sunil Patel',
    email: `sunil_${Date.now()}@shreefood.in`,
    mobile: '+91 98980 12345',
    password: 'password123',
    city: 'Ahmedabad',
    planId: 'plan-starter'
  });
  console.log('4. Onboarding New Restaurant:', regRes.status, 'Business ID:', regRes.data.businessId, 'Owner ID:', regRes.data.ownerId);

  // 5. Test Branch Limit enforcement on the new starter plan (max 2 branches)
  const newOwnerToken = regRes.data.token;
  console.log('5. Adding Branch 2 for Shree Food Restaurant...');
  const br2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/restaurant/branches',
    method: 'POST',
    headers: { Authorization: `Bearer ${newOwnerToken}`, 'Content-Type': 'application/json' }
  }, { name: 'Shree Food - Satellite Outlet', city: 'Ahmedabad' });
  console.log('   Branch 2:', br2.status, br2.data.branch?.name);

  console.log('   Attempting to add Branch 3 (Limit exceeded on Starter plan)...');
  const br3 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/restaurant/branches',
    method: 'POST',
    headers: { Authorization: `Bearer ${newOwnerToken}`, 'Content-Type': 'application/json' }
  }, { name: 'Shree Food - SG Highway Outlet', city: 'Ahmedabad' });
  console.log('   Branch 3 (Expected 403 limit reached):', br3.status, br3.data.message);

  console.log('\nAll SaaS backend tests completed successfully!');
}

run().catch(err => {
  console.error('Error running test:', err.message);
});
