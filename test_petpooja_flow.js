const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: raw ? JSON.parse(raw) : null });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runPetpoojaFlowTest() {
  console.log('\n===============================================================');
  console.log('  SERVEFLOW PETPOOJA-STYLE BUSINESS FLOW E2E TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${title} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. PUBLIC DEMO REQUEST / SALES LEAD SUBMISSION
    console.log('--- Phase 1: Inbound Lead Capture (Assisted Sales) ---');
    const leadPayload = {
      restaurant_name: 'Haveli Grand Dining',
      owner_name: 'Harshvardhan Rathore',
      mobile: '+91 98290 55443',
      email: `harsh_${Date.now()}@haveligrand.in`,
      city: 'Jaipur',
      number_of_branches: 3,
      restaurant_type: 'Fine Dine',
      daily_orders: '300-600',
      current_software: 'Excel Sheets',
      requirements: 'Multi-Outlet Central Billing, QR Table Ordering, Kitchen KDS',
      message: 'Opening 2 more outlets next month. Need full cloud ERP demo.'
    };
    const leadRes = await request('POST', '/api/public/leads', leadPayload);
    assert('Public Demo Lead Submitted Successfully', leadRes.status === 201 && leadRes.data?.lead?.id, `Lead ID: ${leadRes.data?.lead?.id}`);
    const leadId = leadRes.data?.lead?.id;

    // 2. SUPER ADMIN AUTHENTICATION
    console.log('\n--- Phase 2: Super Admin Platform Authority ---');
    const adminLoginRes = await request('POST', '/api/admin/auth/login', {
      email: 'admin@serveflow.io',
      password: 'password123'
    });
    assert('Super Admin Authentication', adminLoginRes.status === 200 && adminLoginRes.data?.token);
    const adminToken = adminLoginRes.data?.token;

    // 3. SUPER ADMIN RETRIEVES LEADS PIPELINE
    const leadsListRes = await request('GET', '/api/admin/leads', null, adminToken);
    assert('Super Admin Retrieves Sales Pipeline', leadsListRes.status === 200 && Array.isArray(leadsListRes.data?.leads));
    const capturedLead = (leadsListRes.data?.leads || []).find(l => l.id === leadId);
    assert('Submitted Lead Present in Super Admin Queue', Boolean(capturedLead), `Restaurant: ${capturedLead?.restaurant_name}`);

    // 4. SUPER ADMIN UPDATES LEAD (DEMO SCHEDULED)
    const updateLeadRes = await request('PUT', `/api/admin/leads/${leadId}`, {
      status: 'demo_scheduled',
      assigned_to: 'Vikram Sales Head',
      notes: 'Demo confirmed for Thursday 4 PM via Google Meet.'
    }, adminToken);
    assert('Super Admin Schedules Demo & Assigns Lead', updateLeadRes.status === 200 && updateLeadRes.data?.lead?.status === 'demo_scheduled');

    // 5. SUPER ADMIN CONVERTS LEAD INTO LIVE RESTAURANT TENANT
    console.log('\n--- Phase 3: Tenant Conversion & Onboarding Initiation ---');
    const convertRes = await request('POST', `/api/admin/leads/${leadId}/convert`, {
      planId: 'plan-pro',
      billingCycle: 'monthly',
      password: 'password123'
    }, adminToken);
    assert('Lead Converted to Live Restaurant Tenant', convertRes.status === 201 && convertRes.data?.restaurant?.businessId);
    const newBusinessId = convertRes.data?.restaurant?.businessId;
    const newCompanyId = convertRes.data?.restaurant?.companyId;
    const ownerEmail = leadPayload.email;
    console.log(`    Generated Tenant: ${newBusinessId} (Company: ${newCompanyId})`);

    // 6. RESTAURANT OWNER LOGS IN
    console.log('\n--- Phase 4: Restaurant Owner Authentication & Onboarding ---');
    const ownerLoginRes = await request('POST', '/api/auth/login', {
      email: ownerEmail,
      password: 'password123'
    });
    assert('Newly Converted Owner Authenticates', ownerLoginRes.status === 200 && ownerLoginRes.data?.token);
    const ownerToken = ownerLoginRes.data?.token;

    // 7. OWNER RETRIEVES 12-STEP ONBOARDING PROGRESS
    const onboardProgressRes = await request('GET', '/api/restaurant/onboarding', null, ownerToken);
    assert('Owner Retrieves 12-Step Onboarding Status', onboardProgressRes.status === 200 && onboardProgressRes.data?.progress);

    // 8. OWNER ADVANCES THROUGH ONBOARDING STEPS
    const step2Res = await request('POST', '/api/restaurant/onboarding/step', {
      step: 2,
      data: { city: 'Jaipur', phone: '+91 98290 55443' }
    }, ownerToken);
    assert('Owner Saves Onboarding Step 2 (Business Info)', step2Res.status === 200 && step2Res.data?.progress?.current_step >= 2);

    // 9. OWNER FINALIZES ONBOARDING
    const completeOnboardRes = await request('POST', '/api/restaurant/onboarding/complete', {}, ownerToken);
    assert('Owner Finalizes Onboarding & Launches Live', completeOnboardRes.status === 200 && completeOnboardRes.data?.progress?.is_completed === true);

    // 10. MULTI-BRANCH MANAGEMENT & PLAN QUOTA ENFORCEMENT
    console.log('\n--- Phase 5: Multi-Branch & Plan Limit Enforcement ---');
    const branch1Res = await request('POST', '/api/restaurant/branches', {
      name: 'Haveli Vaishali Nagar Branch',
      code: 'BR-VAISHALI',
      city: 'Jaipur'
    }, ownerToken);
    assert('Owner Adds Branch 1 within Plan Quota', branch1Res.status === 201 && branch1Res.data?.branch?.id);

    // Add branches up to Pro limit (5)
    await request('POST', '/api/restaurant/branches', { name: 'Haveli C-Scheme Branch', code: 'BR-CSCHEME', city: 'Jaipur' }, ownerToken);
    await request('POST', '/api/restaurant/branches', { name: 'Haveli Malviya Nagar Branch', code: 'BR-MALVIYA', city: 'Jaipur' }, ownerToken);
    await request('POST', '/api/restaurant/branches', { name: 'Haveli Mansarovar Branch', code: 'BR-MANSAROVAR', city: 'Jaipur' }, ownerToken);

    // 6th branch should exceed Pro plan (max 5)
    const exceedBranchRes = await request('POST', '/api/restaurant/branches', {
      name: 'Haveli Airport Hub Branch',
      code: 'BR-AIRPORT',
      city: 'Jaipur'
    }, ownerToken);
    assert('Hard Branch Limit Enforcement (403 PLAN_LIMIT_REACHED)', exceedBranchRes.status === 403 && exceedBranchRes.data?.code === 'PLAN_LIMIT_REACHED', 'Blocked 6th branch on 5-branch plan');

    // 11. DECOUPLED RBAC ROLE CREATION
    console.log('\n--- Phase 6: Decoupled RBAC Matrix ---');
    const customRoleRes = await request('POST', '/api/restaurant/roles', {
      name: 'Senior Floor Captain',
      description: 'Supervises table captains and orders across assigned floor',
      permissions: ['pos.view', 'pos.create_order', 'orders.view', 'tables.view']
    }, ownerToken);
    assert('Owner Creates Custom RBAC Role', customRoleRes.status === 201 && customRoleRes.data?.role?.id);

    // 12. CUSTOMER CONTACTLESS ORDERING VIA QR
    console.log('\n--- Phase 7: Customer Dining & Order Lifecycle ---');
    const publicMenuRes = await request('GET', '/api/public/menu/restaurant-demo');
    assert('Customer Visual QR Menu Loads', publicMenuRes.status === 200 && Array.isArray(publicMenuRes.data?.categories));

    const orderRes = await request('POST', '/api/orders', {
      table_id: 'tbl-01',
      table_name: 'Table 1',
      customer_name: 'Maharaja Guest',
      order_type: 'dine-in',
      items: [
        { itemId: 'item-01', name: 'Paneer Tikka Angara', price: 320, quantity: 2, total: 640 },
        { itemId: 'item-02', name: 'Butter Garlic Naan', price: 90, quantity: 3, total: 270 }
      ],
      subtotal: 910,
      tax: 45.5,
      total: 955.5
    });
    const orderId = orderRes.data?.id || orderRes.data?.order?.id;
    assert('Customer Places Dining Order via QR/Web', orderRes.status === 201 && Boolean(orderId), `Order ID: ${orderId}`);

    // 13. KITCHEN RECEIVES KOT
    console.log('\n--- Phase 8: Kitchen (KDS) & Billing ---');
    const kotRes = await request('GET', '/api/kot', null, ownerToken);
    assert('Kitchen KDS Receives Real-Time Order Ticket', kotRes.status === 200 && Array.isArray(kotRes.data));

    // 14. CASHIER SETTLES BILL
    const chargeRes = await request('POST', `/api/orders/${orderId}/charge`, {
      payment_method: 'upi',
      amount: 955.5
    }, ownerToken);
    assert('Cashier POS Processes Order Payment', chargeRes.status === 200 && chargeRes.data?.order?.payment_status === 'paid');

    // 15. REPORTS UPDATE
    const reportsRes = await request('GET', '/api/reports', null, ownerToken);
    assert('Financial Analytics Scoped to Tenant', reportsRes.status === 200 && (reportsRes.data?.summary || reportsRes.data?.salesSummary));

    // 16. SUPPORT TICKET SYSTEM
    console.log('\n--- Phase 9: Support & Incident Ticketing ---');
    const ticketRes = await request('POST', '/api/restaurant/support', {
      subject: 'Configure Thermal POS-80 Network Printer for Kitchen',
      category: 'Hardware / Printer',
      priority: 'Medium',
      description: 'Need assistance setting static IP 192.168.1.150 for kitchen thermal printer.'
    }, ownerToken);
    assert('Restaurant Owner Raises Support Ticket', ticketRes.status === 201 && ticketRes.data?.ticket?.id);
    const ticketId = ticketRes.data?.ticket?.id;

    // Super Admin resolves ticket
    const resolveTicketRes = await request('PUT', `/api/admin/support/${ticketId}`, {
      status: 'resolved',
      admin_response: 'Network configuration guide dispatched. Static IP bound to kitchen printer MAC address.'
    }, adminToken);
    assert('Super Admin Resolves Support Ticket', resolveTicketRes.status === 200 && resolveTicketRes.data?.ticket?.status === 'resolved');

    // 17. HARD MULTI-TENANT ISOLATION
    console.log('\n--- Phase 10: Multi-Tenant Data Sovereignty ---');
    const abcOwnerLogin = await request('POST', '/api/auth/login', {
      email: 'ceo@abcfoods.com',
      password: 'password123'
    });
    const abcToken = abcOwnerLogin.data?.token;

    // ABC Foods cannot see Haveli's branches
    const abcBranches = await request('GET', '/api/restaurant/branches', null, abcToken);
    const leakedBranch = (abcBranches.data?.branches || []).find(b => b.name.includes('Haveli'));
    assert('Strict Tenant Isolation: Restaurant A Cannot View Restaurant B Branches', !leakedBranch, 'Verified zero cross-tenant leak');

    console.log('\n===============================================================');
    console.log(`  E2E TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runPetpoojaFlowTest();
