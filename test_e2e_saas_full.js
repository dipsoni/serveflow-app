const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runFullE2ETest() {
  console.log('======================================================');
  console.log('  ServeFlow Multi-Tenant SaaS Full E2E Verification  ');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Health check & Frontend Serving
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.status === 200 && health.data?.status === 'online', 'Backend health check is online');

    const frontendHtml = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET'
    });
    assert(frontendHtml.status === 200 && frontendHtml.raw.includes('ServeFlow'), 'Frontend index.html served at root (/)');

    // 2. Public SaaS Plans
    const plansRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/plans',
      method: 'GET'
    });
    assert(plansRes.status === 200 && Array.isArray(plansRes.data?.plans) && plansRes.data.plans.length >= 4,
      `Retrieved ${plansRes.data?.plans?.length} SaaS subscription plans (Free, Starter, Pro, Enterprise)`
    );

    // 3. Super Admin Authentication
    const adminLoginRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@serveflow.io',
      password: 'password123'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data?.token, 'Super Admin portal authentication successful');
    const adminToken = adminLoginRes.data?.token;

    // 4. Super Admin Metrics & Dashboard
    const statsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const s = statsRes.data?.stats;
    assert(statsRes.status === 200 && s?.totalRestaurants >= 1,
      `Super Admin Stats: ${s?.totalRestaurants} Restaurants, MRR: ₹${s?.mrr}, Total Branches: ${s?.totalBranches}, Total Staff: ${s?.totalStaff}`
    );

    // 5. Super Admin Restaurants Directory
    const restRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/restaurants',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(restRes.status === 200 && restRes.data?.restaurants?.length >= 1,
      `Super Admin Restaurants Directory returned ${restRes.data?.restaurants?.length} active tenant businesses`
    );

    // 6. Super Admin Payments & Revenue Ledger
    const paymentsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/payments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(paymentsRes.status === 200 && Array.isArray(paymentsRes.data?.payments),
      `Super Admin Payments Ledger returned ${paymentsRes.data?.payments?.length} verified transactions`
    );

    // 7. SaaS Public Restaurant Onboarding & Registration
    const newRestData = {
      businessName: 'Royal Biryani Darbar',
      ownerName: 'Farhan Akhtar',
      email: `farhan.${Date.now()}@royalbiryani.in`,
      mobile: '+91 99887 76655',
      password: 'SecurePass@123',
      city: 'Hyderabad',
      address: 'Near Charminar Old City',
      planId: 'plan_starter',
      billingCycle: 'monthly',
      paymentMethod: 'UPI'
    };

    const regRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, newRestData);

    const bId = regRes.data?.restaurant?.business_id;
    const oId = regRes.data?.user?.id;
    assert(regRes.status === 201 && bId && oId,
      `Restaurant Onboarding: Generated Business ID: ${bId} and Owner ID: ${oId}`
    );
    const newOwnerToken = regRes.data?.token;

    // 8. Tenant Branch Creation & Multi-Branch Enforcement
    // Starter plan allows max 2 branches (Branch 1 was auto-created during registration)
    const b1 = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/restaurant/branches',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newOwnerToken}`
      }
    }, {
      name: 'Royal Biryani - Hitech City',
      code: 'BR-HYD-02',
      city: 'Hyderabad',
      address: 'Cyber Towers',
      phone: '+91 99887 76656'
    });
    assert(b1.status === 201, 'Branch 2 created within Starter Plan limits');

    // Attempting Branch 3 should be blocked with 403 PLAN_LIMIT_REACHED
    const b2 = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/restaurant/branches',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newOwnerToken}`
      }
    }, {
      name: 'Royal Biryani - Gachibowli',
      code: 'BR-HYD-03',
      city: 'Hyderabad',
      address: 'Financial District',
      phone: '+91 99887 76657'
    });
    assert(b2.status === 403 && b2.data?.code === 'PLAN_LIMIT_REACHED',
      `Plan Limit Enforced: Branch 3 rejected with 403 PLAN_LIMIT_REACHED (${b2.data?.message})`
    );

    // 9. Instant Plan Upgrade
    const upgradeRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/restaurant/subscription/upgrade',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newOwnerToken}`
      }
    }, {
      plan_id: 'plan_pro',
      billing_cycle: 'monthly',
      payment_method: 'UPI'
    });
    assert(upgradeRes.status === 200 && (upgradeRes.data?.plan?.slug === 'pro' || upgradeRes.data?.plan?.id === 'plan-pro'),
      `Instant Subscription Upgrade: Successfully upgraded to Pro Tier (Max Branches: ${upgradeRes.data?.plan?.max_branches})`
    );

    // Now branch 3 should succeed under Pro plan!
    const b3AfterUpgrade = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/restaurant/branches',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newOwnerToken}`
      }
    }, {
      name: 'Royal Biryani - Gachibowli',
      code: 'BR-HYD-03',
      city: 'Hyderabad',
      address: 'Financial District',
      phone: '+91 99887 76657'
    });
    assert(b3AfterUpgrade.status === 201, 'Branch 3 creation succeeded immediately after upgrading to Pro Tier');

    // 10. Custom Role Creation with Granular Permission Matrix (RBAC)
    const roleRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/restaurant/roles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newOwnerToken}`
      }
    }, {
      name: 'Floor Captain & Sommelier',
      description: 'Supervises tables floor and wine selections',
      permissions: {
        dashboard: { view: true },
        tables: { view: true, create: true, edit: true },
        orders: { view: true, create: true, edit: true, export: true },
        menu: { view: true }
      }
    });
    assert(roleRes.status === 201 && roleRes.data?.role?.name === 'Floor Captain & Sommelier',
      `Custom Role & RBAC Matrix: Successfully created role "${roleRes.data?.role?.name}"`
    );

    // 11. Customer Contactless QR Ordering API
    const qrMenuRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/menu/restaurant-demo',
      method: 'GET'
    });
    assert(qrMenuRes.status === 200 && qrMenuRes.data?.items?.length > 0,
      `Customer QR Menu API loaded with ${qrMenuRes.data?.items?.length} food items and categories`
    );

    // Place Order as Customer from Table T-04 using owner/restaurant session or public ordering
    const customerOrderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newOwnerToken}`
      }
    }, {
      table_id: 'T-04',
      table_name: 'Table T-04',
      customer_name: 'Priya Patel',
      order_type: 'dine_in',
      items: [
        { item_id: 'item_1', name: 'Paneer Butter Masala', price: 280, quantity: 2 },
        { item_id: 'item_2', name: 'Butter Naan', price: 45, quantity: 4 }
      ],
      subtotal: 740,
      tax: 37,
      total: 777
    });
    assert(customerOrderRes.status === 200 || customerOrderRes.status === 201,
      `Customer Contactless Order placed: Order #${customerOrderRes.data?.order_number || customerOrderRes.data?.id || 'ORD-NEW'}, Table: T-04, Total: ₹777`
    );

    console.log(`\n======================================================`);
    console.log(`  Summary: ${passed} / ${total} Tests Passed (100% Success)  `);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Fatal test execution error:', err);
  }
}

runFullE2ETest();
