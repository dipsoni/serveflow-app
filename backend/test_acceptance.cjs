const http = require('http');

async function testAcceptance() {
  const loginData = JSON.stringify({ email: 'ceo@abcfoods.com', password: 'password123' });
  const loginRes = await postJson('http://localhost:5000/api/auth/login', loginData);
  const token = loginRes.token;

  console.log('=== TEST 1: RECIPE & INVENTORY AVAILABILITY ===');
  const recipes = await getJson('http://localhost:5000/api/recipes', token);
  const rotiRecipe = recipes.find(r => r.name === 'Roti');
  console.log(`Roti Available: ${rotiRecipe.sellable_quantity} (Limiting: ${rotiRecipe.limiting_ingredient})`);
  console.log(`Expected: 2 -> ${rotiRecipe.sellable_quantity === 2 ? 'PASS ✅' : 'FAIL ❌'}`);

  console.log('\n=== TEST 2: SHARED INGREDIENT CART VALIDATION ===');
  // 2 Roti (20ml) + 1 Paratha (15ml) = 35ml Oil (Stock is 25ml)
  const cartValidation = await postJson('http://localhost:5000/api/menu/validate-cart', JSON.stringify({
    items: [
      { id: 'item-roti', name: 'Roti', quantity: 2 },
      { id: 'item-paratha', name: 'Lachha Paratha', quantity: 1 }
    ]
  }), token);

  console.log('Cart valid:', cartValidation.isValid);
  console.log('Message:', cartValidation.message);
  console.log(`Expected: Blocked due to Oil shortage -> ${!cartValidation.isValid ? 'PASS ✅' : 'FAIL ❌'}`);

  console.log('\n=== TEST 3: CUSTOMER QR AVAILABILITY SANITIZATION ===');
  const publicMenu = await getJson('http://localhost:5000/api/public/menu/restaurant-demo');
  const publicRoti = publicMenu.items.find(i => i.id === 'item-roti');
  console.log('Public Roti is_available:', publicRoti.is_available);
  console.log('Public Roti has limiting_ingredient exposed?:', publicRoti.limiting_ingredient !== undefined);
  console.log('Public Roti has ingredients exposed?:', publicRoti.ingredients !== undefined);
  console.log(`Expected: Clean boolean is_available, NO sensitive inventory data -> ${publicRoti.is_available === true && publicRoti.limiting_ingredient === undefined ? 'PASS ✅' : 'FAIL ❌'}`);
}

function getJson(url, token = null) {
  return new Promise((resolve, reject) => {
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function postJson(url, jsonString, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonString)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(url, { method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(jsonString);
    req.end();
  });
}

testAcceptance();
