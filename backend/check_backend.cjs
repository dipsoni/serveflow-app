const http = require('http');

async function test() {
  const loginData = JSON.stringify({ email: 'ceo@abcfoods.com', password: 'password123' });
  const req = http.request('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(body);
      const token = parsed.token;
      console.log('Login success:', parsed.user?.name, 'restaurant_id:', parsed.user?.restaurant_id, 'company_id:', parsed.user?.company_id);

      // Query /api/recipes
      http.get('http://localhost:5000/api/recipes', {
        headers: { 'Authorization': 'Bearer ' + token }
      }, (rRes) => {
        let rBody = '';
        rRes.on('data', chunk => rBody += chunk);
        rRes.on('end', () => {
          console.log('Recipes status:', rRes.statusCode);
          const list = JSON.parse(rBody);
          console.log('Recipes count:', list.length);
          list.forEach(r => {
            console.log(`- ${r.name} (${r.menu_item_name}): Cost Rs.${r.total_cost}, Available: ${r.sellable_quantity}, Limiting: ${r.limiting_ingredient}`);
          });
        });
      });
    });
  });
  req.write(loginData);
  req.end();
}
test();
