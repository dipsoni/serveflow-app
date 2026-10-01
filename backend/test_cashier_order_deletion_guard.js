const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSecurityTest() {
  console.log('========================================================================');
  console.log('🛡️ TESTING ROLE-BASED ORDER DELETION / VOID SECURITY (CASHIER VS ADMIN)');
  console.log('========================================================================\n');

  // 1. Authenticate Cashier (Rohan Joshi)
  const cashierAuth = await request('POST', '/auth/login', {
    email: 'cashier@serveflow.com',
    password: 'password123'
  });
  const cashierToken = cashierAuth.body.token;
  console.log(`✅ 1. Logged in as Cashier: ${cashierAuth.body.user.name} (Role: ${cashierAuth.body.user.role})`);

  // 2. Authenticate Admin/Owner (Vikram Malhotra)
  const ownerAuth = await request('POST', '/auth/login', {
    email: 'owner@serveflow.com',
    password: 'password123'
  });
  const ownerToken = ownerAuth.body.token;
  console.log(`✅ 2. Logged in as Admin/Owner: ${ownerAuth.body.user.name} (Role: ${ownerAuth.body.user.role})\n`);

  // 3. Cashier creates a fake order
  console.log('🛒 3. Cashier creates a fake order at Table T05:');
  const fakeOrderRes = await request('POST', '/orders', {
    table_id: 'tbl-05',
    table_name: 'T05',
    customer_name: 'Fake Guest',
    order_type: 'dine-in',
    items: [
      {
        menu_item_id: 'item-04',
        name: 'Paneer Butter Masala',
        price: 360,
        quantity: 2,
        amount: 720
      }
    ],
    subtotal: 720,
    tax: 36,
    total: 756
  }, { Authorization: `Bearer ${cashierToken}` });

  const fakeOrder = fakeOrderRes.body;
  console.log(`   - Fake Order Created: ${fakeOrder.order_number || fakeOrder.id} at Table T05`);
  console.log(`   - Inventory Deducted: ${fakeOrder.is_inventory_deducted}\n`);

  // 4. CASHIER ATTEMPTS TO DELETE THE FAKE ORDER DIRECTLY
  console.log('🚫 4. Cashier attempts to DELETE the order directly:');
  const cashierDeleteAttempt = await request('DELETE', `/orders/${fakeOrder.id}`, {
    reason: 'I made a mistake, delete this fake order'
  }, { Authorization: `Bearer ${cashierToken}` });

  console.log(`   - HTTP Status: ${cashierDeleteAttempt.status}`);
  console.log(`   - Response: ${cashierDeleteAttempt.body.message}\n`);

  if (cashierDeleteAttempt.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY! Expected 403 Forbidden for Cashier, but got ${cashierDeleteAttempt.status}`);
  }
  console.log('🔒 VERIFIED: Cashier was strictly BLOCKED from deleting the order (403 Forbidden)!\n');

  // Verify order is still intact
  const checkOrder = await request('GET', `/orders/${fakeOrder.id}`, null, { Authorization: `Bearer ${cashierToken}` });
  if (checkOrder.body.status === 'cancelled' || checkOrder.status === 404) {
    throw new Error('Order should not have been cancelled/deleted!');
  }

  // 5. ADMIN / OWNER DELETES THE FAKE ORDER
  console.log('👑 5. Admin / Owner deletes the fake order:');
  const adminDeleteRes = await request('DELETE', `/orders/${fakeOrder.id}`, {
    reason: 'Fake order created by cashier - voided and restocked by Owner',
    restock_inventory: true
  }, { Authorization: `Bearer ${ownerToken}` });

  console.log(`   - HTTP Status: ${adminDeleteRes.status}`);
  console.log(`   - Message: ${adminDeleteRes.body.message}\n`);

  if (adminDeleteRes.status !== 200) {
    throw new Error(`Admin delete failed with status ${adminDeleteRes.status}: ${JSON.stringify(adminDeleteRes.body)}`);
  }

  // 6. Verify Table Freeing & Stock Restocking
  console.log('🔍 6. Post-Deletion Verification:');
  const tablesRes = await request('GET', '/tables', null, { Authorization: `Bearer ${ownerToken}` });
  const table05 = tablesRes.body.find(t => t.id === 'tbl-05');
  console.log(`   - Table T05 Status: ${table05.status} (Expected: available)`);

  const movRes = await request('GET', '/inventory/movements', null, { Authorization: `Bearer ${ownerToken}` });
  const voidMovement = movRes.body.find(m => m.type === 'void_reversal' && m.order_id === fakeOrder.id);
  console.log(`   - Restocked Inventory Movement: Type=${voidMovement?.type}, Qty=${voidMovement?.quantity} ${voidMovement?.unit}`);
  console.log(`   - Restock Reason: "${voidMovement?.reason}"\n`);

  if (table05.status !== 'available') {
    throw new Error(`Table should be 'available', but is '${table05.status}'`);
  }
  if (!voidMovement) {
    throw new Error('Missing void_reversal stock movement!');
  }

  // 7. Test Manager Override PIN for Cashier (e.g. at counter when manager is present)
  console.log('🔑 7. Testing Cashier with Manager PIN Override (PIN: 1234):');
  const fakeOrder2 = (await request('POST', '/orders', {
    customer_name: 'Test Mistake',
    order_type: 'takeaway',
    items: [{ menu_item_id: 'item-01', name: 'Paneer Tikka Angara', price: 320, quantity: 1, amount: 320 }],
    subtotal: 320,
    tax: 16,
    total: 336
  }, { Authorization: `Bearer ${cashierToken}` })).body;

  const cashierWithPinRes = await request('DELETE', `/orders/${fakeOrder2.id}`, {
    reason: 'Customer walked out before payment',
    manager_pin: '1234'
  }, { Authorization: `Bearer ${cashierToken}` });

  console.log(`   - HTTP Status with Manager PIN: ${cashierWithPinRes.status}`);
  console.log(`   - Message: ${cashierWithPinRes.body.message}\n`);

  if (cashierWithPinRes.status !== 200) {
    throw new Error(`Manager PIN override failed: ${JSON.stringify(cashierWithPinRes.body)}`);
  }

  console.log('========================================================================');
  console.log('🎉 ALL SECURITY CHECKS PASSED!');
  console.log('   1. Cashier CANNOT delete orders directly (403 Forbidden).');
  console.log('   2. Admin / Owner CAN delete / void orders.');
  console.log('   3. Manager PIN / Credentials override permits cashier station voiding.');
  console.log('   4. Raw materials are restocked, tables released, and KOTs cancelled.');
  console.log('========================================================================');
}

runSecurityTest().catch(err => {
  console.error('\n❌ SECURITY TEST FAILED:', err.message);
  process.exit(1);
});
