const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- STARTING SERVEFLOW BILL FLOW E2E TEST ---');

  // 1. Login
  const loginRes = await request('POST', '/auth/login', {
    email: 'owner@serveflow.com',
    password: 'password123'
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('1. ✓ Logged in as Admin');

  // 2. Find an available table
  const tablesRes = await request('GET', '/tables', null, token);
  const availableTable = tablesRes.data.find(t => t.status === 'available');
  if (!availableTable) {
    console.error('No available table found to test! Tables:', tablesRes.data);
    process.exit(1);
  }
  console.log(`2. ✓ Found Available Table: ${availableTable.table_number} (${availableTable.id})`);

  // 3. Create Dine-In Order on available table
  const orderPayload = {
    order_type: 'dine-in',
    table_id: availableTable.id,
    table_name: `Table ${availableTable.table_number.replace(/^T-?/i, '')}`,
    customer_name: 'E2E Test Guest',
    customer_phone: '+91 99999 11111',
    items: [
      {
        id: 'item-01',
        name: 'Paneer Tikka Angara',
        price: 320,
        quantity: 2
      },
      {
        id: 'item-06',
        name: 'Awadhi Veg Biryani',
        price: 340,
        quantity: 1
      }
    ],
    notes: 'Bill Flow Test'
  };

  const createRes = await request('POST', '/orders', orderPayload, token);
  if (createRes.status !== 201 && createRes.status !== 200) {
    console.error('Order creation failed:', createRes);
    process.exit(1);
  }
  const order = createRes.data;
  console.log(`3. ✓ Order created: ${order.order_number} (${order.id}) Total: ₹${order.total}`);

  // 4. Verify table is now OCCUPIED
  const checkOccupiedTables = await request('GET', '/tables', null, token);
  const tblAfterOrder = checkOccupiedTables.data.find(t => t.id === availableTable.id);
  console.log(`4. Table status: ${tblAfterOrder.status} (current_order_id: ${tblAfterOrder.current_order_id})`);
  if (tblAfterOrder.status !== 'occupied') {
    throw new Error(`Expected table to be occupied, got ${tblAfterOrder.status}`);
  }
  console.log('4. ✓ Table is correctly OCCUPIED');

  // 5. Request Bill / Move to Billing Pending
  const billReqRes = await request('POST', `/orders/${order.id}/request-bill`, {}, token);
  if (billReqRes.status !== 200) {
    console.error('Request bill failed:', billReqRes);
    process.exit(1);
  }
  console.log(`5. ✓ Bill requested. Order status: ${billReqRes.data.status}`);
  if (billReqRes.data.status !== 'billing_pending') {
    throw new Error(`Expected order status to be billing_pending, got ${billReqRes.data.status}`);
  }

  // 6. Verify table moved to BILLING
  const checkBillingTables = await request('GET', '/tables', null, token);
  const tblAfterBill = checkBillingTables.data.find(t => t.id === availableTable.id);
  console.log(`6. Table status after bill request: ${tblAfterBill.status}`);
  if (tblAfterBill.status !== 'billing') {
    throw new Error(`Expected table to be billing, got ${tblAfterBill.status}`);
  }
  console.log('6. ✓ Table is correctly in BILLING status');

  // 7. Record Payment & Auto-Free Table
  const payRes = await request('POST', `/orders/${order.id}/payment`, {
    amount: order.total,
    payment_method: 'upi',
    payment_reference: 'UPI-TXN-123456'
  }, token);
  if (payRes.status !== 200) {
    console.error('Payment failed:', payRes);
    process.exit(1);
  }
  console.log(`7. ✓ Payment successful: ₹${payRes.data.order?.total} via ${payRes.data.order?.payment_method}`);
  if (payRes.data.order?.payment_status !== 'paid' || payRes.data.order?.status !== 'paid') {
    throw new Error(`Expected order to be paid, got status=${payRes.data.order?.status}, payment_status=${payRes.data.order?.payment_status}`);
  }

  // 8. Verify Table is Automatically Released to AVAILABLE
  const checkFreeTables = await request('GET', '/tables', null, token);
  const tblAfterPay = checkFreeTables.data.find(t => t.id === availableTable.id);
  console.log(`8. Table status after payment: ${tblAfterPay.status} (current_order_id: ${tblAfterPay.current_order_id})`);
  if (tblAfterPay.status !== 'available' || tblAfterPay.current_order_id !== null) {
    throw new Error(`Expected table to be available with null order, got status=${tblAfterPay.status}, current_order_id=${tblAfterPay.current_order_id}`);
  }
  console.log('8. ✓ Table is automatically released to AVAILABLE');

  // 9. Prevent Double Payment (Requirement 15)
  const doublePayRes = await request('POST', `/orders/${order.id}/payment`, {
    amount: order.total,
    payment_method: 'cash'
  }, token);
  console.log(`9. Double payment attempt response status: ${doublePayRes.status} message: ${doublePayRes.data.message}`);
  if (doublePayRes.status !== 400 || !doublePayRes.data.message.includes('already been paid')) {
    throw new Error(`Expected 400 already paid error, got ${doublePayRes.status}`);
  }
  console.log('9. ✓ Double payment safely rejected with 400 ALREADY_PAID');

  // 10. Prevent requesting bill on already paid order
  const reqBillOnPaid = await request('POST', `/orders/${order.id}/request-bill`, {}, token);
  console.log(`10. Request bill on paid order response status: ${reqBillOnPaid.status} message: ${reqBillOnPaid.data.message}`);
  if (reqBillOnPaid.status !== 400) {
    throw new Error(`Expected 400 on requesting bill for paid order, got ${reqBillOnPaid.status}`);
  }
  console.log('10. ✓ Requesting bill on paid order safely rejected');

  // 11. POS Direct Counter Settlement (paid on creation)
  const posSettlement = await request('POST', '/orders', {
    order_type: 'takeaway',
    customer_name: 'Counter Guest',
    items: [
      { id: 'item-01', name: 'Paneer Tikka Angara', price: 320, quantity: 1 }
    ],
    status: 'paid',
    payment_status: 'paid',
    payment_method: 'cash',
    notes: 'POS Counter Instant Bill'
  }, token);
  console.log(`11. POS direct settlement response: ${posSettlement.status} (order: ${posSettlement.data.order_number}, status: ${posSettlement.data.status}, payment: ${posSettlement.data.payment_status})`);
  if (posSettlement.data.payment_status !== 'paid' || posSettlement.data.status !== 'paid') {
    throw new Error('Expected POS order to be paid upon creation');
  }
  console.log('11. ✓ POS Counter Direct Settlement created as PAID');

  console.log('\n======================================================');
  console.log('  ALL 11 BILL FLOW REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
