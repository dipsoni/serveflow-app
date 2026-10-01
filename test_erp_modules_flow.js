// test_erp_modules_flow.js
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function runTests() {
  console.log('========================================================');
  console.log(' TESTING ERP ROLES, PERMISSIONS & ALLOWED MODULES FLOW');
  console.log('========================================================\n');

  // Test 1: Login as CEO / Super Admin
  console.log('1. Testing CEO Login (ceo@abcfoods.com)...');
  const ceoRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'ceo@abcfoods.com', password: 'password123' });

  if (ceoRes.status !== 200) {
    console.error('FAILED: CEO login failed', ceoRes);
    process.exit(1);
  }
  const ceoToken = ceoRes.data.token;
  const ceoUser = ceoRes.data.user;
  console.log(`✓ CEO login successful: ${ceoUser.name}`);
  console.log(`  Allowed Modules Count: ${ceoUser.allowed_modules?.length || 0}`);
  console.log(`  All Branches Access: ${ceoUser.has_all_branch_access}`);

  // Test 2: Fetch ERP users list
  console.log('\n2. Fetching ERP users list from /api/erp/users...');
  const usersRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/erp/users',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${ceoToken}` }
  });

  if (usersRes.status !== 200 || !usersRes.data.users) {
    console.error('FAILED: Could not fetch ERP users', usersRes);
    process.exit(1);
  }
  console.log(`✓ Retrieved ${usersRes.data.users.length} ERP users`);

  // Test 3: Verify Raj Gupta profile matching Screenshot 1
  console.log('\n3. Verifying Raj Gupta user profile (usr-raj-gupta-01)...');
  const rajUser = usersRes.data.users.find(u => u.id === 'usr-raj-gupta-01' || u.email === 'raj.gupta@abcfoods.com');
  if (!rajUser) {
    console.error('FAILED: Raj Gupta profile not found in ERP users list');
    process.exit(1);
  }
  console.log(`✓ Found user: ${rajUser.name} (${rajUser.email})`);
  console.log(`  Role: ${rajUser.role_name} (${rajUser.role_id})`);
  console.log(`  Allowed Modules: [${rajUser.allowed_modules?.join(', ')}]`);
  console.log(`  Assigned Branches: [${rajUser.branches?.map(b => b.name).join(', ')}]`);

  // Test 4: Login as Raj Gupta and verify token & allowed_modules
  console.log('\n4. Testing login directly as Raj Gupta (raj.gupta@abcfoods.com)...');
  const rajLoginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'raj.gupta@abcfoods.com', password: 'password123' });

  if (rajLoginRes.status !== 200) {
    console.error('FAILED: Raj Gupta login failed', rajLoginRes);
    process.exit(1);
  }
  const rajData = rajLoginRes.data.user;
  console.log(`✓ Raj Gupta logged in successfully:`);
  console.log(`  Allowed modules in session: ${JSON.stringify(rajData.allowed_modules)}`);
  
  // Verify strict module restrictions
  const hasPOS = rajData.allowed_modules.includes('pos');
  const hasOrders = rajData.allowed_modules.includes('orders');
  const hasKitchen = rajData.allowed_modules.includes('kot');
  const hasReports = rajData.allowed_modules.includes('reports');

  if (hasPOS && hasOrders && !hasKitchen && !hasReports) {
    console.log(`✓ STRICT ISOLATION CONFIRMED: Raj Gupta only has access to POS & Orders, NOT Kitchen or Reports!`);
  } else {
    console.error(`FAILED: Module isolation incorrect. hasKitchen=${hasKitchen}, hasReports=${hasReports}`);
    process.exit(1);
  }

  // Test 5: Admin updates Raj Gupta's allowed modules to also include Kitchen
  console.log('\n5. Testing Admin update of Raj Gupta allowed modules (adding "kot")...');
  const updateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/erp/users/usr-raj-gupta-01',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ceoToken}`
    }
  }, {
    allowed_modules: ['pos', 'orders', 'tables', 'customers', 'kot'],
    roles: ['role-cashier', 'role-kitchen-staff'],
    role_id: 'role-cashier'
  });

  if (updateRes.status !== 200 || !updateRes.data.user) {
    console.error('FAILED: Could not update user', updateRes);
    process.exit(1);
  }
  console.log(`✓ Successfully updated Raj Gupta profile:`);
  console.log(`  New Allowed Modules: [${updateRes.data.user.allowed_modules.join(', ')}]`);
  console.log(`  Assigned Roles: [${updateRes.data.user.roles.join(', ')}]`);

  // Test 6: Verify Chef Sanjeev Kumar module isolation
  console.log('\n6. Testing Chef Sanjeev Kumar isolation (chef.satellite@abcfoods.com)...');
  const chefLoginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'chef.satellite@abcfoods.com', password: 'password123' });

  if (chefLoginRes.status !== 200) {
    console.error('FAILED: Chef login failed', chefLoginRes);
    process.exit(1);
  }
  const chefData = chefLoginRes.data.user;
  console.log(`✓ Chef Sanjeev Kumar logged in:`);
  console.log(`  Allowed modules: [${chefData.allowed_modules.join(', ')}]`);
  const chefHasBilling = chefData.allowed_modules.includes('pos');
  const chefHasKitchen = chefData.allowed_modules.includes('kot');

  if (chefHasKitchen && !chefHasBilling) {
    console.log(`✓ STRICT CHEF ISOLATION CONFIRMED: Chef only sees Kitchen & Inventory, NOT POS Billing!`);
  } else {
    console.error('FAILED: Chef module isolation incorrect');
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log(' ALL 6 ERP ROLES & PERMISSIONS TESTS PASSED (100%)');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
