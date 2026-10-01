const bcrypt = require('bcryptjs');
const erpSeed = require('./erpSeedData');

const RESTAURANT_ID = 'rest-urban-spice-01';

const getInitialData = () => {
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const restaurant = {
    id: RESTAURANT_ID,
    name: 'Urban Spice Restaurant',
    tagline: 'Modern Fusion & Authentic Flavors',
    slug: 'restaurant-demo',
    address: '42, Brigade Road, Commercial District, Bengaluru, Karnataka 560001',
    phone: '+91 98765 43210',
    email: 'contact@urbanspice.com',
    gst_number: '29ABCDE1234F1Z5',
    currency: '₹',
    tax_rate: 5.0,
    service_charge: 0.0,
    invoice_prefix: 'INV-2026-',
    footer_text: 'Thank you for dining with us! Visit again. Free Wi-Fi: UrbanSpice_Guest',
    kot_printer: 'Kitchen Thermal POS-80 (192.168.1.101)',
    bill_printer: 'Counter Thermal POS-80 (USB/COM1)'
  };

  const users = [
    {
      id: 'usr-owner-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Vikram Malhotra',
      email: 'owner@serveflow.com',
      phone: '+91 98765 00001',
      password: hashedPassword,
      role: 'owner',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      is_active: true
    },
    {
      id: 'usr-manager-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Ananya Deshmukh',
      email: 'manager@serveflow.com',
      phone: '+91 98765 00002',
      password: hashedPassword,
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      is_active: true
    },
    {
      id: 'usr-cashier-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Rohan Joshi',
      email: 'cashier@serveflow.com',
      phone: '+91 98765 00003',
      password: hashedPassword,
      role: 'cashier',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      is_active: true
    },
    {
      id: 'usr-kitchen-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Chef Sanjeev Kumar',
      email: 'kitchen@serveflow.com',
      phone: '+91 98765 00004',
      password: hashedPassword,
      role: 'kitchen',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
      is_active: true
    }
  ];

  const categories = [
    { id: 'cat-01', restaurant_id: RESTAURANT_ID, name: 'Starters', slug: 'starters', description: 'Appetizers and quick bites', display_order: 1, is_active: true },
    { id: 'cat-02', restaurant_id: RESTAURANT_ID, name: 'Main Course', slug: 'main-course', description: 'Curries, gravies and breads', display_order: 2, is_active: true },
    { id: 'cat-03', restaurant_id: RESTAURANT_ID, name: 'Chinese & Bowls', slug: 'chinese', description: 'Noodles, fried rice, and wok specials', display_order: 3, is_active: true },
    { id: 'cat-04', restaurant_id: RESTAURANT_ID, name: 'Pizza & Burger', slug: 'pizza-burger', description: 'Wood-fired pizzas and gourmet burgers', display_order: 4, is_active: true },
    { id: 'cat-05', restaurant_id: RESTAURANT_ID, name: 'Beverages', slug: 'beverages', description: 'Cold brews, mocktails, and fresh coolers', display_order: 5, is_active: true },
    { id: 'cat-06', restaurant_id: RESTAURANT_ID, name: 'Desserts', slug: 'desserts', description: 'Sweet cravings and traditional treats', display_order: 6, is_active: true }
  ];

  const menuItems = [
    {
      id: 'item-01',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-01',
      name: 'Paneer Tikka Angara',
      description: 'Marinated cottage cheese cubes chargrilled in tandoor with aromatic spices.',
      price: 320,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80',
      preparation_time: 15,
      variants: [{ name: 'Regular (6 pcs)', price: 320 }, { name: 'Platter (10 pcs)', price: 480 }],
      add_ons: [{ name: 'Extra Mint Chutney', price: 25 }, { name: 'Cheese Burst Topping', price: 60 }]
    },
    {
      id: 'item-02',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-01',
      name: 'Crispy Corn Salt & Pepper',
      description: 'Tender corn kernels tossed with peppers, scallions, and roasted garlic.',
      price: 240,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
      preparation_time: 12,
      variants: [],
      add_ons: [{ name: 'Spicy Schezwan Dip', price: 30 }]
    },
    {
      id: 'item-03',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-01',
      name: 'Murgh Malai Tikka',
      description: 'Succulent chicken tenders in cream cheese, cardamom and green chili marinade.',
      price: 390,
      is_veg: false,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
      preparation_time: 18,
      variants: [{ name: 'Half (5 pcs)', price: 390 }, { name: 'Full (9 pcs)', price: 620 }],
      add_ons: [{ name: 'Rumali Roti (1 pc)', price: 40 }]
    },
    {
      id: 'item-04',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-02',
      name: 'Paneer Butter Masala',
      description: 'Rich tomato, butter, and cashew silk gravy with tender malai paneer.',
      price: 360,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
      preparation_time: 20,
      variants: [{ name: 'Regular Portion', price: 360 }, { name: 'Handi Large', price: 540 }],
      add_ons: [{ name: 'Butter Naan', price: 60 }, { name: 'Garlic Naan', price: 75 }]
    },
    {
      id: 'item-05',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-02',
      name: 'Dal Makhani Slow-Simmered',
      description: 'Black lentils slow cooked overnight on charcoal with cultured churned butter.',
      price: 290,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=80',
      preparation_time: 15,
      variants: [],
      add_ons: [{ name: 'Tandoori Roti (2 pcs)', price: 50 }, { name: 'Jeera Rice Bowl', price: 160 }]
    },
    {
      id: 'item-06',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-02',
      name: 'Awadhi Veg Biryani',
      description: 'Fragrant long-grain aged basmati layered with seasonal vegetables and saffron.',
      price: 340,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
      preparation_time: 18,
      variants: [{ name: 'Regular', price: 340 }, { name: 'Family Pot', price: 690 }],
      add_ons: [{ name: 'Burani Garlic Raita', price: 50 }, { name: 'Mirchi Ka Salan', price: 40 }]
    },
    {
      id: 'item-07',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-02',
      name: 'Butter Chicken Old Delhi Style',
      description: 'Charred tandoori chicken cooked in velvety sweet-tangy makhani sauce.',
      price: 440,
      is_veg: false,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80',
      preparation_time: 20,
      variants: [{ name: 'Boneless Regular', price: 440 }, { name: 'With Bone', price: 410 }],
      add_ons: [{ name: 'Butter Naan', price: 60 }, { name: 'Extra Cream Swirl', price: 30 }]
    },
    {
      id: 'item-08',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-03',
      name: 'Hakka Chilli Garlic Noodles',
      description: 'Wok tossed noodles with crunchy julienned veggies and smoked garlic chili paste.',
      price: 260,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
      preparation_time: 15,
      variants: [{ name: 'Vegetable', price: 260 }, { name: 'Chicken & Egg', price: 330 }],
      add_ons: [{ name: 'Manchurian Gravy Cup', price: 90 }]
    },
    {
      id: 'item-09',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-03',
      name: 'Paneer Chilli Dry',
      description: 'Crispy cottage cheese tossed with bell peppers, onion petals and dark soy sauce.',
      price: 310,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=400&q=80',
      preparation_time: 14,
      variants: [],
      add_ons: [{ name: 'Extra Sauce', price: 30 }]
    },
    {
      id: 'item-10',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-04',
      name: 'Margherita Fresca Pizza',
      description: 'San Marzano plum tomato sauce, fresh mozzarella fior di latte, and basil leaves.',
      price: 390,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80',
      preparation_time: 16,
      variants: [{ name: '10 inch Medium', price: 390 }, { name: '12 inch Large', price: 540 }],
      add_ons: [{ name: 'Extra Mozzarella Cheese', price: 70 }, { name: 'Jalapenos & Olives', price: 50 }]
    },
    {
      id: 'item-11',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-04',
      name: 'Fiery Paneer & Corn Pizza',
      description: 'Tandoori spiced paneer cubes, sweet golden corn, red paprika, and melted gouda.',
      price: 430,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
      preparation_time: 18,
      variants: [{ name: '10 inch Medium', price: 430 }, { name: '12 inch Large', price: 590 }],
      add_ons: [{ name: 'Cheese Burst Crust', price: 90 }]
    },
    {
      id: 'item-12',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-04',
      name: 'Smoked Crispy Veg Burger',
      description: 'Crispy herb potato & corn patty, chipotle mayo, cheddar cheese, and brioche bun.',
      price: 220,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      preparation_time: 12,
      variants: [],
      add_ons: [{ name: 'French Fries & Dip', price: 70 }, { name: 'Double Cheese Slice', price: 35 }]
    },
    {
      id: 'item-13',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-05',
      name: 'Artisanal Cold Coffee Shake',
      description: 'Double espresso blended with premium vanilla cream, milk, and dark cocoa dust.',
      price: 180,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
      preparation_time: 8,
      variants: [{ name: 'Classic Cold Brew', price: 180 }, { name: 'Hazelnut Infused', price: 210 }],
      add_ons: [{ name: 'Whipped Cream', price: 30 }, { name: 'Vanilla Ice Cream Scoop', price: 45 }]
    },
    {
      id: 'item-14',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-05',
      name: 'Blue Curacao Virgin Mojito',
      description: 'Muddled fresh mint, lime chunks, crushed ice, blue curacao syrup, and sparkling soda.',
      price: 160,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
      preparation_time: 6,
      variants: [],
      add_ons: []
    },
    {
      id: 'item-15',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-06',
      name: 'Gulab Jamun with Rabri',
      description: 'Warm melt-in-mouth milk dumplings served over chilled saffron pistachio rabri.',
      price: 190,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      preparation_time: 8,
      variants: [],
      add_ons: [{ name: 'Vanilla Ice Cream', price: 50 }]
    },
    {
      id: 'item-16',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-06',
      name: 'Warm Belgian Chocolate Sizzler',
      description: 'Fudge chocolate brownie on hot sizzler plate with Belgian chocolate sauce & gelato.',
      price: 250,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
      preparation_time: 10,
      variants: [],
      add_ons: [{ name: 'Extra Chocolate Drizzle', price: 30 }]
    },
    {
      id: 'item-roti',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-02',
      name: 'Roti',
      description: 'Fresh clay-oven baked whole wheat roti brushed with pure desi ghee.',
      price: 35,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80',
      preparation_time: 8,
      variants: [],
      add_ons: []
    },
    {
      id: 'item-paratha',
      restaurant_id: RESTAURANT_ID,
      category_id: 'cat-02',
      name: 'Lachha Paratha',
      description: 'Multi-layered flaky whole wheat paratha crisped on the tandoor.',
      price: 60,
      is_veg: true,
      gst_rate: 5,
      is_available: true,
      image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80',
      preparation_time: 10,
      variants: [],
      add_ons: []
    }
  ];

  const diningTables = [
    { id: 'tbl-01', restaurant_id: RESTAURANT_ID, table_number: 'T01', floor: 'Floor 1', capacity: 2, status: 'available', current_order_id: null },
    { id: 'tbl-02', restaurant_id: RESTAURANT_ID, table_number: 'T02', floor: 'Floor 1', capacity: 4, status: 'occupied', current_order_id: 'ord-1025' },
    { id: 'tbl-03', restaurant_id: RESTAURANT_ID, table_number: 'T03', floor: 'Floor 1', capacity: 4, status: 'billing', current_order_id: 'ord-1024' },
    { id: 'tbl-04', restaurant_id: RESTAURANT_ID, table_number: 'T04', floor: 'Floor 1', capacity: 6, status: 'available', current_order_id: null },
    { id: 'tbl-05', restaurant_id: RESTAURANT_ID, table_number: 'T05', floor: 'Floor 1', capacity: 2, status: 'reserved', current_order_id: null },
    { id: 'tbl-06', restaurant_id: RESTAURANT_ID, table_number: 'T06', floor: 'Floor 2', capacity: 4, status: 'occupied', current_order_id: 'ord-1026' },
    { id: 'tbl-07', restaurant_id: RESTAURANT_ID, table_number: 'T07', floor: 'Floor 2', capacity: 6, status: 'available', current_order_id: null },
    { id: 'tbl-08', restaurant_id: RESTAURANT_ID, table_number: 'T08', floor: 'Floor 2', capacity: 8, status: 'available', current_order_id: null },
    { id: 'tbl-09', restaurant_id: RESTAURANT_ID, table_number: 'T09', floor: 'Floor 2', capacity: 4, status: 'occupied', current_order_id: 'ord-1027' },
    { id: 'tbl-10', restaurant_id: RESTAURANT_ID, table_number: 'T10', floor: 'Terrace', capacity: 2, status: 'available', current_order_id: null },
    { id: 'tbl-11', restaurant_id: RESTAURANT_ID, table_number: 'T11', floor: 'Terrace', capacity: 4, status: 'available', current_order_id: null },
    { id: 'tbl-12', restaurant_id: RESTAURANT_ID, table_number: 'T12', floor: 'Terrace', capacity: 4, status: 'occupied', current_order_id: 'ord-1028' }
  ];

  const customers = [
    {
      id: 'cust-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Rahul Sharma',
      phone: '+91 98450 12345',
      email: 'rahul.sharma@gmail.com',
      address: 'Indiranagar 100ft Road, Bengaluru',
      total_orders: 14,
      total_spent: 12450.0,
      last_visit: new Date(Date.now() - 2 * 86400000).toISOString(),
      favorite_items: 'Paneer Butter Masala, Garlic Naan, Cold Coffee',
      notes: 'Prefers table near the window. Mild spice only.'
    },
    {
      id: 'cust-02',
      restaurant_id: RESTAURANT_ID,
      name: 'Priya Patel',
      phone: '+91 98451 23456',
      email: 'priya.patel@outlook.com',
      address: 'Koramangala 4th Block, Bengaluru',
      total_orders: 9,
      total_spent: 8720.0,
      last_visit: new Date(Date.now() - 86400000).toISOString(),
      favorite_items: 'Margherita Pizza, Virgin Mojito',
      notes: 'Allergic to mushrooms. Usually pays with UPI.'
    },
    {
      id: 'cust-03',
      restaurant_id: RESTAURANT_ID,
      name: 'Amit Verma',
      phone: '+91 98452 34567',
      email: 'amit.verma@techcorp.in',
      address: 'Whitefield Main Road, Bengaluru',
      total_orders: 6,
      total_spent: 5310.0,
      last_visit: new Date(Date.now() - 4 * 86400000).toISOString(),
      favorite_items: 'Murgh Malai Tikka, Butter Chicken',
      notes: 'Corporate regular lunch client.'
    },
    {
      id: 'cust-04',
      restaurant_id: RESTAURANT_ID,
      name: 'Neha Gupta',
      phone: '+91 98453 45678',
      email: 'neha.gupta@yahoo.com',
      address: 'HSR Layout Sector 2, Bengaluru',
      total_orders: 11,
      total_spent: 9890.0,
      last_visit: new Date(Date.now() - 3 * 3600000).toISOString(),
      favorite_items: 'Veg Biryani, Gulab Jamun with Rabri',
      notes: 'Frequent weekend family dinners.'
    },
    {
      id: 'cust-05',
      restaurant_id: RESTAURANT_ID,
      name: 'Vikramaditya Roy',
      phone: '+91 98454 56789',
      email: 'vikram.roy@domain.org',
      address: 'Lavelle Road, Bengaluru',
      total_orders: 4,
      total_spent: 4100.0,
      last_visit: new Date(Date.now() - 6 * 86400000).toISOString(),
      favorite_items: 'Crispy Corn Salt & Pepper',
      notes: 'Likes extra spicy.'
    }
  ];

  const orders = [
    {
      id: 'ord-1024',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1024',
      table_id: 'tbl-03',
      table_name: 'Table T03',
      customer_id: 'cust-01',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98450 12345',
      order_type: 'dine-in',
      items: [
        { menuItemId: 'item-04', name: 'Paneer Butter Masala', price: 360, quantity: 2, variant: 'Regular Portion', addOns: ['Butter Naan'], amount: 780, notes: 'Medium spicy' },
        { menuItemId: 'item-05', name: 'Dal Makhani Slow-Simmered', price: 290, quantity: 1, variant: null, addOns: ['Jeera Rice Bowl'], amount: 450, notes: '' },
        { menuItemId: 'item-13', name: 'Artisanal Cold Coffee Shake', price: 180, quantity: 2, variant: 'Classic Cold Brew', addOns: [], amount: 360, notes: '' }
      ],
      subtotal: 1590.0,
      discount: 100.0,
      tax: 74.5,
      service_charge: 0.0,
      total: 1564.5,
      status: 'billing',
      payment_status: 'unpaid',
      payment_method: 'unpaid',
      notes: 'Guest requested bill printed.',
      created_at: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      id: 'ord-1025',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1025',
      table_id: 'tbl-02',
      table_name: 'Table T02',
      customer_id: 'cust-02',
      customer_name: 'Priya Patel',
      customer_phone: '+91 98451 23456',
      order_type: 'dine-in',
      items: [
        { menuItemId: 'item-10', name: 'Margherita Fresca Pizza', price: 390, quantity: 1, variant: '10 inch Medium', addOns: ['Extra Mozzarella Cheese'], amount: 460, notes: 'Crispy thin crust' },
        { menuItemId: 'item-14', name: 'Blue Curacao Virgin Mojito', price: 160, quantity: 2, variant: null, addOns: [], amount: 320, notes: 'Less ice' }
      ],
      subtotal: 780.0,
      discount: 0.0,
      tax: 39.0,
      service_charge: 0.0,
      total: 819.0,
      status: 'preparing',
      payment_status: 'unpaid',
      payment_method: 'unpaid',
      notes: 'Table 2 dinner',
      created_at: new Date(Date.now() - 22 * 60000).toISOString()
    },
    {
      id: 'ord-1026',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1026',
      table_id: 'tbl-06',
      table_name: 'Table T06',
      customer_id: 'cust-03',
      customer_name: 'Amit Verma',
      customer_phone: '+91 98452 34567',
      order_type: 'dine-in',
      items: [
        { menuItemId: 'item-01', name: 'Paneer Tikka Angara', price: 320, quantity: 2, variant: 'Regular (6 pcs)', addOns: ['Extra Mint Chutney'], amount: 690, notes: 'Less spicy please' },
        { menuItemId: 'item-06', name: 'Awadhi Veg Biryani', price: 340, quantity: 1, variant: 'Regular', addOns: ['Burani Garlic Raita'], amount: 390, notes: '' }
      ],
      subtotal: 1080.0,
      discount: 50.0,
      tax: 51.5,
      service_charge: 0.0,
      total: 1081.5,
      status: 'kot_sent',
      payment_status: 'unpaid',
      payment_method: 'unpaid',
      notes: 'VIP guest table',
      created_at: new Date(Date.now() - 14 * 60000).toISOString()
    },
    {
      id: 'ord-1027',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1027',
      table_id: 'tbl-09',
      table_name: 'Table T09',
      customer_id: 'cust-04',
      customer_name: 'Neha Gupta',
      customer_phone: '+91 98453 45678',
      order_type: 'dine-in',
      items: [
        { menuItemId: 'item-08', name: 'Hakka Chilli Garlic Noodles', price: 260, quantity: 2, variant: 'Vegetable', addOns: [], amount: 520, notes: 'No ajinomoto' },
        { menuItemId: 'item-09', name: 'Paneer Chilli Dry', price: 310, quantity: 1, variant: null, addOns: [], amount: 310, notes: 'Extra crispy' }
      ],
      subtotal: 830.0,
      discount: 0.0,
      tax: 41.5,
      service_charge: 0.0,
      total: 871.5,
      status: 'ready',
      payment_status: 'unpaid',
      payment_method: 'unpaid',
      notes: '',
      created_at: new Date(Date.now() - 32 * 60000).toISOString()
    },
    {
      id: 'ord-1028',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1028',
      table_id: 'tbl-12',
      table_name: 'Table T12',
      customer_id: null,
      customer_name: 'Walk-in Guest',
      customer_phone: '',
      order_type: 'dine-in',
      items: [
        { menuItemId: 'item-11', name: 'Fiery Paneer & Corn Pizza', price: 430, quantity: 1, variant: '10 inch Medium', addOns: [], amount: 430, notes: '' },
        { menuItemId: 'item-13', name: 'Artisanal Cold Coffee Shake', price: 180, quantity: 2, variant: 'Classic Cold Brew', addOns: [], amount: 360, notes: '' }
      ],
      subtotal: 790.0,
      discount: 0.0,
      tax: 39.5,
      service_charge: 0.0,
      total: 829.5,
      status: 'preparing',
      payment_status: 'unpaid',
      payment_method: 'unpaid',
      notes: 'Terrace garden table',
      created_at: new Date(Date.now() - 18 * 60000).toISOString()
    },
    {
      id: 'ord-1021',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1021',
      table_id: null,
      table_name: 'Takeaway',
      customer_id: 'cust-05',
      customer_name: 'Vikramaditya Roy',
      customer_phone: '+91 98454 56789',
      order_type: 'takeaway',
      items: [
        { menuItemId: 'item-04', name: 'Paneer Butter Masala', price: 360, quantity: 1, variant: 'Regular Portion', addOns: [], amount: 360, notes: '' },
        { menuItemId: 'item-06', name: 'Awadhi Veg Biryani', price: 340, quantity: 2, variant: 'Regular', addOns: [], amount: 680, notes: 'Pack spoons & tissue' }
      ],
      subtotal: 1040.0,
      discount: 0.0,
      tax: 52.0,
      service_charge: 0.0,
      total: 1092.0,
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'upi',
      notes: 'Packed nicely in thermal bag',
      created_at: new Date(Date.now() - 110 * 60000).toISOString(),
      completed_at: new Date(Date.now() - 85 * 60000).toISOString()
    },
    {
      id: 'ord-1020',
      restaurant_id: RESTAURANT_ID,
      order_number: '#ORD-1020',
      table_id: null,
      table_name: 'Delivery',
      customer_id: 'cust-01',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98450 12345',
      order_type: 'delivery',
      items: [
        { menuItemId: 'item-10', name: 'Margherita Fresca Pizza', price: 390, quantity: 2, variant: '10 inch Medium', addOns: [], amount: 780, notes: '' },
        { menuItemId: 'item-12', name: 'Smoked Crispy Veg Burger', price: 220, quantity: 2, variant: null, addOns: [], amount: 440, notes: '' }
      ],
      subtotal: 1220.0,
      discount: 100.0,
      tax: 56.0,
      service_charge: 0.0,
      total: 1176.0,
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'card',
      notes: 'Delivered to Indiranagar',
      created_at: new Date(Date.now() - 180 * 60000).toISOString(),
      completed_at: new Date(Date.now() - 140 * 60000).toISOString()
    }
  ];

  const kots = [
    {
      id: 'kot-1048',
      restaurant_id: RESTAURANT_ID,
      kot_number: 'KOT #1048',
      order_id: 'ord-1026',
      order_number: '#ORD-1026',
      table_number: 'Table 6',
      order_type: 'dine-in',
      items: [
        { name: 'Paneer Tikka Angara', quantity: 2, notes: 'Less spicy please', status: 'pending' },
        { name: 'Awadhi Veg Biryani', quantity: 1, notes: 'With burani garlic raita', status: 'pending' }
      ],
      special_note: 'VIP Guest. Special presentation requested.',
      status: 'new',
      created_at: new Date(Date.now() - 14 * 60000).toISOString()
    },
    {
      id: 'kot-1049',
      restaurant_id: RESTAURANT_ID,
      kot_number: 'KOT #1049',
      order_id: 'ord-1025',
      order_number: '#ORD-1025',
      table_number: 'Table 2',
      order_type: 'dine-in',
      items: [
        { name: 'Margherita Fresca Pizza', quantity: 1, notes: 'Crispy thin crust', status: 'preparing' },
        { name: 'Blue Curacao Virgin Mojito', quantity: 2, notes: 'Less ice', status: 'ready' }
      ],
      special_note: 'Serve beverage immediately upon prep',
      status: 'preparing',
      created_at: new Date(Date.now() - 22 * 60000).toISOString(),
      prepared_at: new Date(Date.now() - 19 * 60000).toISOString()
    },
    {
      id: 'kot-1050',
      restaurant_id: RESTAURANT_ID,
      kot_number: 'KOT #1050',
      order_id: 'ord-1028',
      order_number: '#ORD-1028',
      table_number: 'Table 12',
      order_type: 'dine-in',
      items: [
        { name: 'Fiery Paneer & Corn Pizza', quantity: 1, notes: 'Extra cheese sprinkle', status: 'preparing' },
        { name: 'Artisanal Cold Coffee Shake', quantity: 2, notes: 'Chilled glass', status: 'ready' }
      ],
      special_note: 'Terrace service team',
      status: 'preparing',
      created_at: new Date(Date.now() - 18 * 60000).toISOString()
    },
    {
      id: 'kot-1051',
      restaurant_id: RESTAURANT_ID,
      kot_number: 'KOT #1051',
      order_id: 'ord-1027',
      order_number: '#ORD-1027',
      table_number: 'Table 9',
      order_type: 'dine-in',
      items: [
        { name: 'Hakka Chilli Garlic Noodles', quantity: 2, notes: 'No ajinomoto', status: 'ready' },
        { name: 'Paneer Chilli Dry', quantity: 1, notes: 'Extra crispy', status: 'ready' }
      ],
      special_note: 'Table is waiting for main course',
      status: 'ready',
      created_at: new Date(Date.now() - 32 * 60000).toISOString(),
      ready_at: new Date(Date.now() - 5 * 60000).toISOString()
    }
  ];

  const inventoryItems = [
    {
      id: 'inv-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Malai Paneer Fresh',
      category: 'Dairy',
      current_stock: 15.0,
      unit: 'kg',
      min_stock: 5.0,
      cost_per_unit: 380.0,
      status: 'healthy'
    },
    {
      id: 'inv-02',
      restaurant_id: RESTAURANT_ID,
      name: 'Organic Tomatoes',
      category: 'Vegetables',
      current_stock: 25.0,
      unit: 'kg',
      min_stock: 10.0,
      cost_per_unit: 45.0,
      status: 'healthy'
    },
    {
      id: 'inv-03',
      restaurant_id: RESTAURANT_ID,
      name: 'Aged Basmati Rice (Daawat)',
      category: 'Grains',
      current_stock: 45.0,
      unit: 'kg',
      min_stock: 20.0,
      cost_per_unit: 140.0,
      status: 'healthy'
    },
    {
      id: 'inv-04',
      restaurant_id: RESTAURANT_ID,
      name: 'Mozzarella Shredded Cheese',
      category: 'Dairy',
      current_stock: 18.0,
      unit: 'kg',
      min_stock: 6.0,
      cost_per_unit: 490.0,
      status: 'healthy'
    },
    {
      id: 'inv-05',
      restaurant_id: RESTAURANT_ID,
      name: 'Dark Roast Arabica Coffee Beans',
      category: 'Beverages',
      current_stock: 8.0,
      unit: 'kg',
      min_stock: 3.0,
      cost_per_unit: 950.0,
      status: 'healthy'
    },
    {
      id: 'inv-06',
      restaurant_id: RESTAURANT_ID,
      name: 'Fresh Chicken Breast Boneless',
      category: 'Meat',
      current_stock: 20.0,
      unit: 'kg',
      min_stock: 8.0,
      cost_per_unit: 260.0,
      status: 'healthy'
    },
    {
      id: 'inv-07',
      restaurant_id: RESTAURANT_ID,
      name: 'Sunflower Cooking Oil (Fortune)',
      category: 'Oils',
      current_stock: 40.0,
      unit: 'ltr',
      min_stock: 15.0,
      cost_per_unit: 135.0,
      status: 'healthy'
    },
    {
      id: 'inv-08',
      restaurant_id: RESTAURANT_ID,
      name: 'Takeaway Meal Containers 750ml',
      category: 'Packaging',
      current_stock: 180.0,
      unit: 'pcs',
      min_stock: 100.0,
      cost_per_unit: 8.5,
      status: 'healthy'
    },
    {
      id: 'inv-flour',
      restaurant_id: RESTAURANT_ID,
      name: 'Whole Wheat Flour (Atta)',
      category: 'Grains & Flours',
      current_stock: 25000.0,
      unit: 'g',
      min_stock: 5000.0,
      cost_per_unit: 0.045,
      status: 'healthy'
    },
    {
      id: 'inv-oil',
      restaurant_id: RESTAURANT_ID,
      name: 'Refined Cooking Oil',
      category: 'Oils',
      current_stock: 15000.0,
      unit: 'ml',
      min_stock: 3000.0,
      cost_per_unit: 0.14,
      status: 'healthy'
    },
    {
      id: 'inv-water',
      restaurant_id: RESTAURANT_ID,
      name: 'Purified Water',
      category: 'Liquids',
      current_stock: 50000.0,
      unit: 'ml',
      min_stock: 5000.0,
      cost_per_unit: 0.005,
      status: 'healthy'
    },
    {
      id: 'inv-butter',
      restaurant_id: RESTAURANT_ID,
      name: 'Cultured Table Butter (Amul)',
      category: 'Dairy',
      current_stock: 12.0,
      unit: 'kg',
      min_stock: 4.0,
      cost_per_unit: 420.0,
      status: 'healthy'
    },
    {
      id: 'inv-cream',
      restaurant_id: RESTAURANT_ID,
      name: 'Fresh Dairy Cooking Cream (25%)',
      category: 'Dairy',
      current_stock: 10.0,
      unit: 'ltr',
      min_stock: 4.0,
      cost_per_unit: 210.0,
      status: 'healthy'
    },
    {
      id: 'inv-dal',
      restaurant_id: RESTAURANT_ID,
      name: 'Black Urad Dal & Kashmiri Rajma',
      category: 'Grains',
      current_stock: 22.0,
      unit: 'kg',
      min_stock: 8.0,
      cost_per_unit: 130.0,
      status: 'healthy'
    },
    {
      id: 'inv-corn',
      restaurant_id: RESTAURANT_ID,
      name: 'Sweet Golden American Corn',
      category: 'Vegetables',
      current_stock: 16.0,
      unit: 'kg',
      min_stock: 5.0,
      cost_per_unit: 95.0,
      status: 'healthy'
    },
    {
      id: 'inv-veggies',
      restaurant_id: RESTAURANT_ID,
      name: 'Farm Fresh Wok & Curry Veggies',
      category: 'Vegetables',
      current_stock: 30.0,
      unit: 'kg',
      min_stock: 10.0,
      cost_per_unit: 40.0,
      status: 'healthy'
    },
    {
      id: 'inv-noodles',
      restaurant_id: RESTAURANT_ID,
      name: 'Authentic Hakka Wok Noodles',
      category: 'Chinese & Bowls',
      current_stock: 20.0,
      unit: 'kg',
      min_stock: 6.0,
      cost_per_unit: 85.0,
      status: 'healthy'
    },
    {
      id: 'inv-sauces',
      restaurant_id: RESTAURANT_ID,
      name: 'Master Soy, Chilli & Garlic Sauces',
      category: 'Condiments',
      current_stock: 12.0,
      unit: 'ltr',
      min_stock: 3.0,
      cost_per_unit: 160.0,
      status: 'healthy'
    },
    {
      id: 'inv-pizza-base',
      restaurant_id: RESTAURANT_ID,
      name: 'Hand-Stretched 10-inch Pizza Crusts',
      category: 'Bakery',
      current_stock: 50.0,
      unit: 'pcs',
      min_stock: 20.0,
      cost_per_unit: 35.0,
      status: 'healthy'
    },
    {
      id: 'inv-burger-bun',
      restaurant_id: RESTAURANT_ID,
      name: 'Gourmet Toasted Brioche Buns',
      category: 'Bakery',
      current_stock: 45.0,
      unit: 'pcs',
      min_stock: 15.0,
      cost_per_unit: 18.0,
      status: 'healthy'
    },
    {
      id: 'inv-milk',
      restaurant_id: RESTAURANT_ID,
      name: 'Full Cream Pasteurized Milk',
      category: 'Dairy',
      current_stock: 35.0,
      unit: 'ltr',
      min_stock: 10.0,
      cost_per_unit: 64.0,
      status: 'healthy'
    },
    {
      id: 'inv-sugar',
      restaurant_id: RESTAURANT_ID,
      name: 'Refined Sulphur-Free Sugar',
      category: 'Pantry',
      current_stock: 25.0,
      unit: 'kg',
      min_stock: 8.0,
      cost_per_unit: 44.0,
      status: 'healthy'
    },
    {
      id: 'inv-icecream',
      restaurant_id: RESTAURANT_ID,
      name: 'Artisanal Madagascar Vanilla Ice Cream',
      category: 'Desserts',
      current_stock: 12.0,
      unit: 'ltr',
      min_stock: 4.0,
      cost_per_unit: 260.0,
      status: 'healthy'
    },
    {
      id: 'inv-mojito-mix',
      restaurant_id: RESTAURANT_ID,
      name: 'Blue Curacao & Fresh Mint Mojito Cordial',
      category: 'Beverages',
      current_stock: 8.0,
      unit: 'ltr',
      min_stock: 2.0,
      cost_per_unit: 320.0,
      status: 'healthy'
    },
    {
      id: 'inv-soya-chaap',
      restaurant_id: RESTAURANT_ID,
      name: 'High-Protein Tender Soya Chaap',
      category: 'Vegetarian',
      current_stock: 15.0,
      unit: 'kg',
      min_stock: 5.0,
      cost_per_unit: 160.0,
      status: 'healthy'
    },
    {
      id: 'inv-spices',
      restaurant_id: RESTAURANT_ID,
      name: 'Urban Spice Royal Master Garam Masala Blend',
      category: 'Spices',
      current_stock: 15.0,
      unit: 'kg',
      min_stock: 4.0,
      cost_per_unit: 450.0,
      status: 'healthy'
    },
    {
      id: 'inv-gulab-jamun',
      restaurant_id: RESTAURANT_ID,
      name: 'Pure Desi Khoya Gulab Jamun Dumplings',
      category: 'Desserts',
      current_stock: 65.0,
      unit: 'pcs',
      min_stock: 20.0,
      cost_per_unit: 14.0,
      status: 'healthy'
    },
    {
      id: 'inv-chocolate',
      restaurant_id: RESTAURANT_ID,
      name: 'Belgian Dark Fudge Brownies (100g)',
      category: 'Desserts',
      current_stock: 40.0,
      unit: 'pcs',
      min_stock: 12.0,
      cost_per_unit: 48.0,
      status: 'healthy'
    }
  ];

  const stockMovements = [
    {
      id: 'mov-01',
      restaurant_id: RESTAURANT_ID,
      item_id: 'inv-01',
      item_name: 'Malai Paneer Fresh',
      type: 'wastage',
      quantity: 1.2,
      reason: 'Excess refrigeration moisture spoiled texture',
      recorded_by: 'Chef Sanjeev Kumar',
      created_at: new Date(Date.now() - 36 * 3600000).toISOString()
    },
    {
      id: 'mov-02',
      restaurant_id: RESTAURANT_ID,
      item_id: 'inv-02',
      item_name: 'Organic Tomatoes',
      type: 'wastage',
      quantity: 2.5,
      reason: 'Overripe lot discarded during prep',
      recorded_by: 'Ananya Deshmukh',
      created_at: new Date(Date.now() - 18 * 3600000).toISOString()
    },
    {
      id: 'mov-03',
      restaurant_id: RESTAURANT_ID,
      item_id: 'inv-04',
      item_name: 'Mozzarella Shredded Cheese',
      type: 'in',
      quantity: 10.0,
      reason: 'Purchase PO-2026-089 received',
      recorded_by: 'Rohan Joshi',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    }
  ];

  const suppliers = [
    {
      id: 'sup-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Fresh Harvest Farms & Dairy',
      phone: '+91 99880 11223',
      email: 'orders@freshharvestfarms.in',
      address: 'Plot 14, Agro Tech Park, Hebbal, Bengaluru',
      gst_number: '29AAAAF1234A1Z1',
      products_supplied: 'Fresh Malai Paneer, Milk, Cream, Butter, Mozzarella',
      outstanding_amount: 14200.0
    },
    {
      id: 'sup-02',
      restaurant_id: RESTAURANT_ID,
      name: 'Green Valley Organic Produce',
      phone: '+91 99880 22334',
      email: 'supply@greenvalleyproduce.com',
      address: 'Wholesale Vegetable Market Yard, Yeshwanthpur, Bengaluru',
      gst_number: '29BBBBG2345B2Z2',
      products_supplied: 'Organic Tomatoes, Onions, Bell Peppers, Herbs, Corn',
      outstanding_amount: 4850.0
    },
    {
      id: 'sup-03',
      restaurant_id: RESTAURANT_ID,
      name: 'Royal Spices & Staples Wholesale',
      phone: '+91 99880 33445',
      email: 'sales@royalspicestaples.com',
      address: 'APMC Yard, APMC Road, Bengaluru',
      gst_number: '29CCCCS3456C3Z3',
      products_supplied: 'Basmati Rice, Whole Spices, Cooking Oil, Flours, Pulses',
      outstanding_amount: 22800.0
    },
    {
      id: 'sup-04',
      restaurant_id: RESTAURANT_ID,
      name: 'Blue Mountain Coffee Roasters',
      phone: '+91 99880 44556',
      email: 'wholesale@bluemountaincoffee.in',
      address: 'Chikmagalur Coffee Hub, Indiranagar, Bengaluru',
      gst_number: '29DDDDD4567D4Z4',
      products_supplied: 'Arabica Coffee Beans, Syrups, Barista Blends',
      outstanding_amount: 3200.0
    }
  ];

  const purchases = [
    {
      id: 'pur-01',
      restaurant_id: RESTAURANT_ID,
      supplier_id: 'sup-01',
      supplier_name: 'Fresh Harvest Farms & Dairy',
      invoice_number: 'INV-FHF-904',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      items: [
        { itemId: 'inv-01', itemName: 'Malai Paneer Fresh', quantity: 10, unit: 'kg', unitPrice: 380, tax: 190, total: 3990 },
        { itemId: 'inv-04', itemName: 'Mozzarella Shredded Cheese', quantity: 8, unit: 'kg', unitPrice: 490, tax: 196, total: 4116 }
      ],
      subtotal: 7720.0,
      tax_total: 386.0,
      grand_total: 8106.0,
      status: 'received'
    },
    {
      id: 'pur-02',
      restaurant_id: RESTAURANT_ID,
      supplier_id: 'sup-02',
      supplier_name: 'Green Valley Organic Produce',
      invoice_number: 'INV-GVO-312',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      items: [
        { itemId: 'inv-02', itemName: 'Organic Tomatoes', quantity: 25, unit: 'kg', unitPrice: 45, tax: 56.25, total: 1181.25 }
      ],
      subtotal: 1125.0,
      tax_total: 56.25,
      grand_total: 1181.25,
      status: 'received'
    },
    {
      id: 'pur-03',
      restaurant_id: RESTAURANT_ID,
      supplier_id: 'sup-03',
      supplier_name: 'Royal Spices & Staples Wholesale',
      invoice_number: 'PO-DRAFT-2026-11',
      date: new Date().toISOString().split('T')[0],
      items: [
        { itemId: 'inv-03', itemName: 'Aged Basmati Rice (Daawat)', quantity: 50, unit: 'kg', unitPrice: 140, tax: 350, total: 7350 },
        { itemId: 'inv-07', itemName: 'Sunflower Cooking Oil (Fortune)', quantity: 30, unit: 'ltr', unitPrice: 135, tax: 202.5, total: 4252.5 }
      ],
      subtotal: 11050.0,
      tax_total: 552.5,
      grand_total: 11602.5,
      status: 'draft'
    }
  ];

  const employees = [
    {
      id: 'emp-01',
      restaurant_id: RESTAURANT_ID,
      name: 'Vikram Malhotra',
      phone: '+91 98765 00001',
      email: 'owner@serveflow.com',
      role: 'owner',
      joining_date: '2023-01-15',
      salary: 120000,
      status: 'active',
      permissions: ['all']
    },
    {
      id: 'emp-02',
      restaurant_id: RESTAURANT_ID,
      name: 'Ananya Deshmukh',
      phone: '+91 98765 00002',
      email: 'manager@serveflow.com',
      role: 'manager',
      joining_date: '2023-04-10',
      salary: 55000,
      status: 'active',
      permissions: ['pos', 'orders', 'kot', 'tables', 'menu', 'inventory', 'purchases', 'suppliers', 'customers', 'employees', 'expenses', 'reports', 'settings']
    },
    {
      id: 'emp-03',
      restaurant_id: RESTAURANT_ID,
      name: 'Rohan Joshi',
      phone: '+91 98765 00003',
      email: 'cashier@serveflow.com',
      role: 'cashier',
      joining_date: '2024-02-01',
      salary: 28000,
      status: 'active',
      permissions: ['pos', 'orders', 'tables', 'customers']
    },
    {
      id: 'emp-04',
      restaurant_id: RESTAURANT_ID,
      name: 'Chef Sanjeev Kumar',
      phone: '+91 98765 00004',
      email: 'kitchen@serveflow.com',
      role: 'kitchen',
      joining_date: '2023-06-20',
      salary: 48000,
      status: 'active',
      permissions: ['kot', 'inventory_view']
    },
    {
      id: 'emp-05',
      restaurant_id: RESTAURANT_ID,
      name: 'Sunil Rao',
      phone: '+91 98765 00005',
      email: 'sunil.waiter@serveflow.com',
      role: 'waiter',
      joining_date: '2024-05-12',
      salary: 22000,
      status: 'active',
      permissions: ['pos', 'tables', 'orders']
    }
  ];

  const expenses = [
    {
      id: 'exp-01',
      restaurant_id: RESTAURANT_ID,
      title: 'Commercial Electricity Bill (BESCOM)',
      category: 'Electricity',
      amount: 14500.0,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Bank Transfer',
      notes: 'Monthly high-tension meter bill for March',
      recorded_by: 'Ananya Deshmukh'
    },
    {
      id: 'exp-02',
      restaurant_id: RESTAURANT_ID,
      title: 'Commercial Kitchen Deep Cleaning & Pest Control',
      category: 'Maintenance',
      amount: 4200.0,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      payment_method: 'UPI',
      notes: 'Certified quarterly sanitization',
      recorded_by: 'Ananya Deshmukh'
    },
    {
      id: 'exp-03',
      restaurant_id: RESTAURANT_ID,
      title: 'Emergency Dairy & Paneer Top-up Cash',
      category: 'Raw Material',
      amount: 1850.0,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      notes: 'Purchased for evening dinner rush',
      recorded_by: 'Rohan Joshi'
    },
    {
      id: 'exp-04',
      restaurant_id: RESTAURANT_ID,
      title: 'Store Property Monthly Rent',
      category: 'Rent',
      amount: 65000.0,
      date: '2026-03-01',
      payment_method: 'Bank Transfer',
      notes: 'Brigade Road branch lease payment',
      recorded_by: 'Vikram Malhotra'
    },
    {
      id: 'exp-05',
      restaurant_id: RESTAURANT_ID,
      title: 'Staff Mid-Month Travel Allowance',
      category: 'Transport',
      amount: 3200.0,
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      payment_method: 'UPI',
      notes: 'Late night drops conveyance',
      recorded_by: 'Ananya Deshmukh'
    }
  ];

  const notifications = [
    {
      id: 'notif-01',
      restaurant_id: RESTAURANT_ID,
      title: 'Low Stock Alert',
      message: 'Organic Tomatoes has dropped to 4 kg (Minimum: 10 kg). Restock recommended.',
      type: 'warning',
      is_read: false,
      link: '/inventory',
      created_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 'notif-02',
      restaurant_id: RESTAURANT_ID,
      title: 'KOT #1051 Ready',
      message: 'KOT for Table 9 (Hakka Noodles, Paneer Chilli) is prepared and hot!',
      type: 'success',
      is_read: false,
      link: '/kot',
      created_at: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: 'notif-03',
      restaurant_id: RESTAURANT_ID,
      title: 'Sales Milestone Achieved',
      message: "Today's sales crossed ₹24,000! Great rush during afternoon lunch hours.",
      type: 'info',
      is_read: true,
      link: '/dashboard',
      created_at: new Date(Date.now() - 90 * 60000).toISOString()
    },
    {
      id: 'notif-04',
      restaurant_id: RESTAURANT_ID,
      title: 'Table 3 Billing Requested',
      message: 'Guest at Table T03 (Rahul Sharma) has requested final invoice.',
      type: 'urgent',
      is_read: false,
      link: '/tables',
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ];

  const recipes = [
    {
      id: 'rec-01',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-01',
      name: 'Paneer Tikka Angara',
      description: 'Marinated cottage cheese chargrilled with aromatic royal spices.',
      preparation_instructions: '1. Cut fresh paneer into uniform 35g cubes.\n2. Toss in mustard oil and garam masala tandoori marinade.\n3. Skewer and roast in tandoor at 320°C for 8 minutes.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.2, unit: 'kg', wastage_percent: 4, cost_per_unit: 380, calculated_cost: 79.04 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.02, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 9.00 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 20, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 2.80 }
      ]
    },
    {
      id: 'rec-02',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-02',
      name: 'Crispy Corn Salt & Pepper',
      description: 'Tender corn kernels tossed with crunchy peppers, scallions, and roasted garlic.',
      preparation_instructions: '1. Dust golden corn with seasoned cornstarch.\n2. Flash fry until golden crisp.\n3. Wok-toss with diced bell peppers, scallions, and crushed pepper.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-corn', ingredient_name: 'Sweet Golden American Corn', quantity: 0.2, unit: 'kg', wastage_percent: 5, cost_per_unit: 95, calculated_cost: 19.95 },
        { ingredient_id: 'inv-veggies', ingredient_name: 'Farm Fresh Wok & Curry Veggies', quantity: 0.05, unit: 'kg', wastage_percent: 8, cost_per_unit: 40, calculated_cost: 2.16 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 30, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 4.20 }
      ]
    },
    {
      id: 'rec-03',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-03',
      name: 'Murgh Malai Tikka',
      description: 'Succulent chicken tenders in cream cheese, green cardamom, and chili marinade.',
      preparation_instructions: '1. Marinate chicken breast chunks in fresh cream, cardamom, and white pepper.\n2. Rest for 45 minutes.\n3. Chargrill in tandoor until tender with light char edges.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-06', ingredient_name: 'Fresh Chicken Breast Boneless', quantity: 0.25, unit: 'kg', wastage_percent: 6, cost_per_unit: 260, calculated_cost: 68.90 },
        { ingredient_id: 'inv-cream', ingredient_name: 'Fresh Dairy Cooking Cream (25%)', quantity: 0.05, unit: 'ltr', wastage_percent: 2, cost_per_unit: 210, calculated_cost: 10.71 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.015, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 6.75 }
      ]
    },
    {
      id: 'rec-pbm',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-04',
      name: 'Paneer Butter Masala',
      description: 'Slow simmered malai paneer cubes in velvety tomato silk gravy.',
      preparation_instructions: '1. Sauté organic tomatoes in cooking oil and cashew paste.\n2. Add malai paneer cubes, cultured butter, and fresh cream.\n3. Simmer on low flame for 6 minutes.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.2, unit: 'kg', wastage_percent: 5, cost_per_unit: 380, calculated_cost: 79.80 },
        { ingredient_id: 'inv-02', ingredient_name: 'Organic Tomatoes', quantity: 0.15, unit: 'kg', wastage_percent: 10, cost_per_unit: 45, calculated_cost: 7.42 },
        { ingredient_id: 'inv-butter', ingredient_name: 'Cultured Table Butter (Amul)', quantity: 0.03, unit: 'kg', wastage_percent: 2, cost_per_unit: 420, calculated_cost: 12.85 },
        { ingredient_id: 'inv-cream', ingredient_name: 'Fresh Dairy Cooking Cream (25%)', quantity: 0.04, unit: 'ltr', wastage_percent: 2, cost_per_unit: 210, calculated_cost: 8.57 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 15, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 2.10 }
      ]
    },
    {
      id: 'rec-05',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-05',
      name: 'Dal Makhani Slow-Simmered',
      description: 'Whole black lentils simmered overnight on charcoal with churned butter and cream.',
      preparation_instructions: '1. Overnight soaked black urad dal & rajma simmered with tomato puree.\n2. Whisk in generous cultured butter and cream.\n3. Finish with smoked charcoal aroma.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 24 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-dal', ingredient_name: 'Black Urad Dal & Kashmiri Rajma', quantity: 0.15, unit: 'kg', wastage_percent: 2, cost_per_unit: 130, calculated_cost: 19.89 },
        { ingredient_id: 'inv-butter', ingredient_name: 'Cultured Table Butter (Amul)', quantity: 0.04, unit: 'kg', wastage_percent: 0, cost_per_unit: 420, calculated_cost: 16.80 },
        { ingredient_id: 'inv-cream', ingredient_name: 'Fresh Dairy Cooking Cream (25%)', quantity: 0.03, unit: 'ltr', wastage_percent: 0, cost_per_unit: 210, calculated_cost: 6.30 },
        { ingredient_id: 'inv-02', ingredient_name: 'Organic Tomatoes', quantity: 0.1, unit: 'kg', wastage_percent: 8, cost_per_unit: 45, calculated_cost: 4.86 }
      ]
    },
    {
      id: 'rec-06',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-06',
      name: 'Awadhi Veg Biryani',
      description: 'Fragrant aged basmati layered with spiced vegetables, saffron, and paneer.',
      preparation_instructions: '1. Parboil basmati rice with whole spices.\n2. Layer spiced vegetables and paneer in handi.\n3. Seal with dough and slow cook on dum for 15 minutes.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-03', ingredient_name: 'Aged Basmati Rice (Daawat)', quantity: 0.18, unit: 'kg', wastage_percent: 4, cost_per_unit: 140, calculated_cost: 26.21 },
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.08, unit: 'kg', wastage_percent: 4, cost_per_unit: 380, calculated_cost: 31.62 },
        { ingredient_id: 'inv-veggies', ingredient_name: 'Farm Fresh Wok & Curry Veggies', quantity: 0.1, unit: 'kg', wastage_percent: 8, cost_per_unit: 40, calculated_cost: 4.32 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.02, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 9.00 }
      ]
    },
    {
      id: 'rec-bc',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-07',
      name: 'Butter Chicken Old Delhi Style',
      description: 'Charred tandoori chicken cooked in velvety sweet-tangy makhani sauce.',
      preparation_instructions: '1. Chargrill boneless chicken chunks.\n2. Reduce organic tomato puree with butter and makhani masala.\n3. Fold in chicken and finish with rich cream swirl.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-06', ingredient_name: 'Fresh Chicken Breast Boneless', quantity: 0.25, unit: 'kg', wastage_percent: 8, cost_per_unit: 260, calculated_cost: 70.20 },
        { ingredient_id: 'inv-02', ingredient_name: 'Organic Tomatoes', quantity: 0.15, unit: 'kg', wastage_percent: 10, cost_per_unit: 45, calculated_cost: 7.42 },
        { ingredient_id: 'inv-butter', ingredient_name: 'Cultured Table Butter (Amul)', quantity: 0.035, unit: 'kg', wastage_percent: 2, cost_per_unit: 420, calculated_cost: 14.99 },
        { ingredient_id: 'inv-cream', ingredient_name: 'Fresh Dairy Cooking Cream (25%)', quantity: 0.04, unit: 'ltr', wastage_percent: 2, cost_per_unit: 210, calculated_cost: 8.57 }
      ]
    },
    {
      id: 'rec-08',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-08',
      name: 'Hakka Chilli Garlic Noodles',
      description: 'Wok tossed noodles with crunchy julienned veggies and smoked garlic chili sauce.',
      preparation_instructions: '1. Boil noodles al dente.\n2. Flash wok-sear veggies with garlic chilli soy reduction.\n3. Toss noodles over high flame for wok hei.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-noodles', ingredient_name: 'Authentic Hakka Wok Noodles', quantity: 0.2, unit: 'kg', wastage_percent: 4, cost_per_unit: 85, calculated_cost: 17.68 },
        { ingredient_id: 'inv-veggies', ingredient_name: 'Farm Fresh Wok & Curry Veggies', quantity: 0.1, unit: 'kg', wastage_percent: 6, cost_per_unit: 40, calculated_cost: 4.24 },
        { ingredient_id: 'inv-sauces', ingredient_name: 'Master Soy, Chilli & Garlic Sauces', quantity: 0.03, unit: 'ltr', wastage_percent: 2, cost_per_unit: 160, calculated_cost: 4.90 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 25, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 3.50 }
      ]
    },
    {
      id: 'rec-09',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-09',
      name: 'Paneer Chilli Dry',
      description: 'Crispy cottage cheese tossed with bell peppers, onion petals and dark soy sauce.',
      preparation_instructions: '1. Lightly batter and crisp paneer cubes.\n2. Sauté capsicum and onion petals in dark soy & chilli glaze.\n3. Toss paneer and finish with spring onions.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.18, unit: 'kg', wastage_percent: 4, cost_per_unit: 380, calculated_cost: 71.14 },
        { ingredient_id: 'inv-veggies', ingredient_name: 'Farm Fresh Wok & Curry Veggies', quantity: 0.08, unit: 'kg', wastage_percent: 6, cost_per_unit: 40, calculated_cost: 3.39 },
        { ingredient_id: 'inv-sauces', ingredient_name: 'Master Soy, Chilli & Garlic Sauces', quantity: 0.03, unit: 'ltr', wastage_percent: 2, cost_per_unit: 160, calculated_cost: 4.90 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 30, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 4.20 }
      ]
    },
    {
      id: 'rec-10',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-10',
      name: 'Margherita Fresca Pizza',
      description: 'San Marzano plum tomato sauce, shredded mozzarella cheese, and fresh basil.',
      preparation_instructions: '1. Hand-stretch pizza crust.\n2. Spread crushed organic tomato sauce.\n3. Layer shredded mozzarella cheese.\n4. Bake in stone oven at 320°C for 6 minutes.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-pizza-base', ingredient_name: 'Hand-Stretched 10-inch Pizza Crusts', quantity: 1, unit: 'pcs', wastage_percent: 0, cost_per_unit: 35, calculated_cost: 35.00 },
        { ingredient_id: 'inv-04', ingredient_name: 'Mozzarella Shredded Cheese', quantity: 0.12, unit: 'kg', wastage_percent: 3, cost_per_unit: 490, calculated_cost: 60.56 },
        { ingredient_id: 'inv-02', ingredient_name: 'Organic Tomatoes', quantity: 0.08, unit: 'kg', wastage_percent: 5, cost_per_unit: 45, calculated_cost: 3.78 }
      ]
    },
    {
      id: 'rec-11',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-11',
      name: 'Fiery Paneer & Corn Pizza',
      description: 'Tandoori spiced paneer cubes, golden sweet corn, mozzarella, and spicy sauce.',
      preparation_instructions: '1. Stretch crust and apply spicy tomato sauce.\n2. Top with mozzarella, marinated paneer cubes, and sweet corn.\n3. Stone-bake until crust is blistered and cheese bubbled.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-pizza-base', ingredient_name: 'Hand-Stretched 10-inch Pizza Crusts', quantity: 1, unit: 'pcs', wastage_percent: 0, cost_per_unit: 35, calculated_cost: 35.00 },
        { ingredient_id: 'inv-04', ingredient_name: 'Mozzarella Shredded Cheese', quantity: 0.12, unit: 'kg', wastage_percent: 3, cost_per_unit: 490, calculated_cost: 60.56 },
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.06, unit: 'kg', wastage_percent: 4, cost_per_unit: 380, calculated_cost: 23.71 },
        { ingredient_id: 'inv-corn', ingredient_name: 'Sweet Golden American Corn', quantity: 0.05, unit: 'kg', wastage_percent: 2, cost_per_unit: 95, calculated_cost: 4.85 }
      ]
    },
    {
      id: 'rec-12',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-12',
      name: 'Smoked Crispy Veg Burger',
      description: 'Crispy herb potato & corn patty, cheddar melt, and soft brioche bun.',
      preparation_instructions: '1. Toast brioche bun with butter.\n2. Crisp fry the spiced veggie patty.\n3. Layer burger with cheese slice, fresh lettuce, and smoky sauce.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-burger-bun', ingredient_name: 'Gourmet Toasted Brioche Buns', quantity: 1, unit: 'pcs', wastage_percent: 0, cost_per_unit: 18, calculated_cost: 18.00 },
        { ingredient_id: 'inv-veggies', ingredient_name: 'Farm Fresh Wok & Curry Veggies', quantity: 0.1, unit: 'kg', wastage_percent: 5, cost_per_unit: 40, calculated_cost: 4.20 },
        { ingredient_id: 'inv-04', ingredient_name: 'Mozzarella Shredded Cheese', quantity: 0.03, unit: 'kg', wastage_percent: 0, cost_per_unit: 490, calculated_cost: 14.70 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 25, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 3.50 }
      ]
    },
    {
      id: 'rec-13',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-13',
      name: 'Artisanal Cold Coffee Shake',
      description: 'Double espresso blended with premium milk, cane sugar, and vanilla cream.',
      preparation_instructions: '1. Extract double shot espresso from Arabica beans.\n2. Blend with chilled milk, cane sugar, and vanilla ice cream.\n3. Serve in frosted glass with dark cocoa dust.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-05', ingredient_name: 'Dark Roast Arabica Coffee Beans', quantity: 0.025, unit: 'kg', wastage_percent: 4, cost_per_unit: 950, calculated_cost: 24.70 },
        { ingredient_id: 'inv-milk', ingredient_name: 'Full Cream Pasteurized Milk', quantity: 0.25, unit: 'ltr', wastage_percent: 2, cost_per_unit: 64, calculated_cost: 16.32 },
        { ingredient_id: 'inv-sugar', ingredient_name: 'Refined Sulphur-Free Sugar', quantity: 0.03, unit: 'kg', wastage_percent: 0, cost_per_unit: 44, calculated_cost: 1.32 },
        { ingredient_id: 'inv-icecream', ingredient_name: 'Artisanal Madagascar Vanilla Ice Cream', quantity: 0.06, unit: 'ltr', wastage_percent: 0, cost_per_unit: 260, calculated_cost: 15.60 }
      ]
    },
    {
      id: 'rec-14',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-14',
      name: 'Blue Curacao Virgin Mojito',
      description: 'Muddled fresh mint, lime chunks, blue curacao cordial, and sparkling soda.',
      preparation_instructions: '1. Muddle fresh mint sprigs with lime wedges.\n2. Add blue curacao cordial and crushed ice.\n3. Top with chilled sparkling water and stir gently.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-mojito-mix', ingredient_name: 'Blue Curacao & Fresh Mint Mojito Cordial', quantity: 0.06, unit: 'ltr', wastage_percent: 0, cost_per_unit: 320, calculated_cost: 19.20 },
        { ingredient_id: 'inv-water', ingredient_name: 'Purified Water', quantity: 250, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.005, calculated_cost: 1.25 }
      ]
    },
    {
      id: 'rec-15',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-15',
      name: 'Gulab Jamun with Rabri',
      description: 'Warm melt-in-mouth milk dumplings served over chilled saffron rabri.',
      preparation_instructions: '1. Warm khoya gulab jamun in cardamom saffron sugar syrup.\n2. Ladle thick chilled saffron rabri in serving coupe.\n3. Place warm dumplings on top with sliced pistachios.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-gulab-jamun', ingredient_name: 'Pure Desi Khoya Gulab Jamun Dumplings', quantity: 2, unit: 'pcs', wastage_percent: 0, cost_per_unit: 14, calculated_cost: 28.00 },
        { ingredient_id: 'inv-milk', ingredient_name: 'Full Cream Pasteurized Milk', quantity: 0.2, unit: 'ltr', wastage_percent: 4, cost_per_unit: 64, calculated_cost: 13.31 },
        { ingredient_id: 'inv-sugar', ingredient_name: 'Refined Sulphur-Free Sugar', quantity: 0.03, unit: 'kg', wastage_percent: 0, cost_per_unit: 44, calculated_cost: 1.32 }
      ]
    },
    {
      id: 'rec-16',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-16',
      name: 'Warm Belgian Chocolate Sizzler',
      description: 'Fudge chocolate brownie on hot sizzler plate with Belgian sauce & vanilla gelato.',
      preparation_instructions: '1. Heat cast iron sizzler plate.\n2. Place warm fudge brownie in center.\n3. Crown with artisanal vanilla ice cream scoop.\n4. Drizzle hot chocolate sauce tableside for sizzle effect.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-chocolate', ingredient_name: 'Belgian Dark Fudge Brownies (100g)', quantity: 1, unit: 'pcs', wastage_percent: 0, cost_per_unit: 48, calculated_cost: 48.00 },
        { ingredient_id: 'inv-icecream', ingredient_name: 'Artisanal Madagascar Vanilla Ice Cream', quantity: 0.08, unit: 'ltr', wastage_percent: 0, cost_per_unit: 260, calculated_cost: 20.80 }
      ]
    },
    {
      id: 'rec-roti',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-roti',
      name: 'Roti',
      description: 'Clay-oven baked whole wheat roti brushed with ghee.',
      preparation_instructions: '1. Knead flour with water and oil into smooth dough.\n2. Portion into 50g dough balls.\n3. Roll thin and bake inside 350°C tandoor for 60 seconds.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-flour', ingredient_name: 'Whole Wheat Flour (Atta)', quantity: 50, unit: 'g', wastage_percent: 2, cost_per_unit: 0.045, calculated_cost: 2.30 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 5, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 0.70 },
        { ingredient_id: 'inv-water', ingredient_name: 'Purified Water', quantity: 25, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.005, calculated_cost: 0.13 }
      ]
    },
    {
      id: 'rec-paratha',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-paratha',
      name: 'Lachha Paratha',
      description: 'Layered spiral flaky paratha tossed with oil and baked in tandoor.',
      preparation_instructions: '1. Pleat dough with cooking oil to form 12 crisp spiral layers.\n2. Roast in tandoor until golden blistered.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-flour', ingredient_name: 'Whole Wheat Flour (Atta)', quantity: 80, unit: 'g', wastage_percent: 4, cost_per_unit: 0.045, calculated_cost: 3.74 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 15, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 2.10 },
        { ingredient_id: 'inv-water', ingredient_name: 'Purified Water', quantity: 35, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.005, calculated_cost: 0.18 }
      ]
    },
    {
      id: 'rec-angara-1',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-mujr6pc7-srjd',
      name: 'Paneer Angara',
      description: 'Fiery smoked paneer cubes in rich red gravy.',
      preparation_instructions: '1. Marinate fresh paneer in spicy Angara paste.\n2. Simmer in tomato onion gravy and infuse with charcoal smoke.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.2, unit: 'kg', wastage_percent: 4, cost_per_unit: 380, calculated_cost: 79.04 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.02, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 9.00 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 20, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 2.80 }
      ]
    },
    {
      id: 'rec-chaap-1',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-mujr6pc7-r1do',
      name: 'Tandoori Soya Chaap',
      description: 'Charred high-protein soya chaap marinated in yogurt, cream and royal spices.',
      preparation_instructions: '1. Cut soya chaap into bite-sized segments.\n2. Toss in tandoori cream marinade.\n3. Roast in tandoor until charred and smoky.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-soya-chaap', ingredient_name: 'High-Protein Tender Soya Chaap', quantity: 0.22, unit: 'kg', wastage_percent: 5, cost_per_unit: 160, calculated_cost: 36.96 },
        { ingredient_id: 'inv-cream', ingredient_name: 'Fresh Dairy Cooking Cream (25%)', quantity: 0.04, unit: 'ltr', wastage_percent: 2, cost_per_unit: 210, calculated_cost: 8.57 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.02, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 9.00 }
      ]
    },
    {
      id: 'rec-angara-2',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-mujrrxg2-j42a',
      name: 'Paneer Angara',
      description: 'Fiery smoked paneer cubes in rich red gravy.',
      preparation_instructions: '1. Marinate fresh paneer in spicy Angara paste.\n2. Simmer in tomato onion gravy and infuse with charcoal smoke.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-01', ingredient_name: 'Malai Paneer Fresh', quantity: 0.2, unit: 'kg', wastage_percent: 4, cost_per_unit: 380, calculated_cost: 79.04 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.02, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 9.00 },
        { ingredient_id: 'inv-oil', ingredient_name: 'Refined Cooking Oil', quantity: 20, unit: 'ml', wastage_percent: 0, cost_per_unit: 0.14, calculated_cost: 2.80 }
      ]
    },
    {
      id: 'rec-chaap-2',
      restaurant_id: RESTAURANT_ID,
      company_id: erpSeed.COMPANY_ABC,
      branch_id: null,
      menu_item_id: 'item-mujrrxg2-kmhg',
      name: 'Tandoori Soya Chaap',
      description: 'Charred high-protein soya chaap marinated in yogurt, cream and royal spices.',
      preparation_instructions: '1. Cut soya chaap into bite-sized segments.\n2. Toss in tandoori cream marinade.\n3. Roast in tandoor until charred and smoky.',
      serving_size: 1,
      is_active: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { ingredient_id: 'inv-soya-chaap', ingredient_name: 'High-Protein Tender Soya Chaap', quantity: 0.22, unit: 'kg', wastage_percent: 5, cost_per_unit: 160, calculated_cost: 36.96 },
        { ingredient_id: 'inv-cream', ingredient_name: 'Fresh Dairy Cooking Cream (25%)', quantity: 0.04, unit: 'ltr', wastage_percent: 2, cost_per_unit: 210, calculated_cost: 8.57 },
        { ingredient_id: 'inv-spices', ingredient_name: 'Urban Spice Royal Master Garam Masala Blend', quantity: 0.02, unit: 'kg', wastage_percent: 0, cost_per_unit: 450, calculated_cost: 9.00 }
      ]
    }
  ];

  // Attach company_id and branch_id to existing tables for multi-tenancy
  const taggedOrders = orders.map((o, idx) => ({
    ...o,
    company_id: erpSeed.COMPANY_ABC,
    branch_id: idx % 3 === 0 ? erpSeed.BRANCH_BOPAL : (idx % 3 === 1 ? erpSeed.BRANCH_SATELLITE : erpSeed.BRANCH_SG_HIGHWAY)
  }));

  const taggedKots = kots.map((k, idx) => ({
    ...k,
    company_id: erpSeed.COMPANY_ABC,
    branch_id: idx % 2 === 0 ? erpSeed.BRANCH_BOPAL : erpSeed.BRANCH_SATELLITE
  }));

  const taggedTables = diningTables.map((t, idx) => ({
    ...t,
    company_id: erpSeed.COMPANY_ABC,
    branch_id: idx < 6 ? erpSeed.BRANCH_BOPAL : (idx < 10 ? erpSeed.BRANCH_SATELLITE : erpSeed.BRANCH_SG_HIGHWAY)
  }));

  const taggedMenuItems = menuItems.map(m => ({
    ...m,
    company_id: erpSeed.COMPANY_ABC,
    branch_id: null // Available to all branches of ABC Foods
  }));

  const taggedInventory = inventoryItems.map((i, idx) => ({
    ...i,
    company_id: erpSeed.COMPANY_ABC,
    branch_id: idx % 2 === 0 ? erpSeed.BRANCH_BOPAL : erpSeed.BRANCH_SATELLITE
  }));

  const erpUsers = erpSeed.getInitialERPUsers();

  return {
    restaurant: { ...restaurant, company_id: erpSeed.COMPANY_ABC },
    users,
    categories,
    menuItems: taggedMenuItems,
    diningTables: taggedTables,
    customers,
    orders: taggedOrders,
    kots: taggedKots,
    inventoryItems: taggedInventory,
    stockMovements,
    recipes,
    suppliers,
    purchases,
    employees,
    expenses,
    notifications,

    // ERP Multi-Tenancy Data
    companies: erpSeed.COMPANIES,
    branches: erpSeed.BRANCHES,
    roles: erpSeed.ENTERPRISE_ROLES,
    erpUsers,
    userBranchAssignments: erpSeed.USER_BRANCH_ASSIGNMENTS,
    auditLogs: erpSeed.INITIAL_AUDIT_LOGS,
    userComments: erpSeed.INITIAL_COMMENTS,
    permissionGroups: erpSeed.PERMISSION_GROUPS,
    allPermissionsList: erpSeed.ALL_PERMISSIONS_LIST,
    moduleProfiles: erpSeed.MODULE_PROFILES,

    // SaaS Platform Multi-Tenant Data
    plans: erpSeed.INITIAL_PLANS,
    superAdmin: erpSeed.SUPER_ADMIN,
    saasRestaurants: erpSeed.SAAS_RESTAURANTS,
    subscriptions: erpSeed.INITIAL_SUBSCRIPTIONS,
    payments: erpSeed.INITIAL_PAYMENTS,
    platformSettings: erpSeed.PLATFORM_SETTINGS,
    salesLeads: erpSeed.INITIAL_SALES_LEADS,
    supportTickets: erpSeed.INITIAL_SUPPORT_TICKETS,
    onboardingProgress: erpSeed.INITIAL_ONBOARDING
  };
};

module.exports = {
  RESTAURANT_ID,
  getInitialData,
  ...erpSeed
};
