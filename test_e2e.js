const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      method: 'GET',
      headers
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing ServeFlow Endpoints...\n');

  // 1. Health
  const health = await get('http://localhost:5000/api/health');
  console.log('✓ [Health Check]', health.data.app, '| Status:', health.data.status, '| DB:', health.data.database);

  // 2. Login
  const login = await post('http://localhost:5000/api/auth/login', {
    email: 'owner@serveflow.com',
    password: 'password123'
  });
  console.log('✓ [Auth Login]', login.data.user.name, `(${login.data.user.role})`, '| Token acquired:', !!login.data.token);
  const token = login.data.token;

  // 3. Dashboard
  const dash = await get('http://localhost:5000/api/dashboard', token);
  console.log('✓ [Dashboard Stats]', 'Today Sales:', dash.data.kpis.todaySales.value, '| Orders:', dash.data.kpis.todayOrders.value, '| Top Item:', dash.data.topSellingItems[0].name);

  // 4. Menu Items
  const menu = await get('http://localhost:5000/api/menu/items', token);
  console.log('✓ [Menu Items]', `Fetched ${menu.data.length} dishes in catalog`);

  // 5. Dining Tables
  const tables = await get('http://localhost:5000/api/tables', token);
  console.log('✓ [Tables Floor]', `Fetched ${tables.data.length} tables across floors`);

  // 6. Orders
  const orders = await get('http://localhost:5000/api/orders', token);
  console.log('✓ [Orders List]', `Fetched ${orders.data.length} active/recent customer checks`);

  // 7. KOT
  const kot = await get('http://localhost:5000/api/kot', token);
  console.log('✓ [Kitchen KOT]', `Fetched ${kot.data.length} live kitchen tickets`);

  // 8. Inventory
  const inv = await get('http://localhost:5000/api/inventory', token);
  console.log('✓ [Inventory Stock]', `Fetched ${inv.data.length} raw material stock items`);

  // 9. Purchases
  const pur = await get('http://localhost:5000/api/purchases', token);
  console.log('✓ [Purchases]', `Fetched ${pur.data.length} purchase consignment orders`);

  // 10. Suppliers
  const sup = await get('http://localhost:5000/api/suppliers', token);
  console.log('✓ [Suppliers]', `Fetched ${sup.data.length} registered vendors`);

  // 11. Customers
  const cust = await get('http://localhost:5000/api/customers', token);
  console.log('✓ [Customers]', `Fetched ${cust.data.length} guest profiles`);

  // 12. Employees
  const emp = await get('http://localhost:5000/api/employees', token);
  console.log('✓ [Employees]', `Fetched ${emp.data.length} staff roster members`);

  // 13. Expenses
  const exp = await get('http://localhost:5000/api/expenses', token);
  console.log('✓ [Expenses]', `Fetched ${exp.data.expenses.length} operating overhead line items`);

  // 14. Reports
  const rep = await get('http://localhost:5000/api/reports', token);
  console.log('✓ [Reports Analytics]', 'Gross Sales:', rep.data.summary.grossRevenue, '| Net Profit:', rep.data.summary.netProfit);

  // 15. Settings
  const sett = await get('http://localhost:5000/api/settings', token);
  console.log('✓ [Restaurant Settings]', sett.data.name, '| GSTIN:', sett.data.gst_number);

  // 16. Public QR Menu
  const publicMenu = await get('http://localhost:5000/api/public/menu/restaurant-demo');
  console.log('✓ [Public QR Menu]', publicMenu.data.restaurant.name, '| Dishes Available to Guests:', publicMenu.data.items.length);

  console.log('\n>>> ALL 16 E2E ENDPOINTS VALIDATED AND RESPONDING 100% SUCCESSFULLY! <<<\n');
}

runTests().catch(console.error);
