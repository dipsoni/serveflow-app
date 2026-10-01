import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  PauseCircle,
  CheckCircle2,
  X,
  FileText,
  Clock,
  Sparkles,
  ArrowRightLeft,
  Merge,
  Flame,
  Coffee,
  IceCream,
  Wifi,
  WifiOff,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Bike,
  Store,
  Tag,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import PrintableBillModal from '../components/common/PrintableBillModal';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import ManagerPinModal from '../components/ManagerPinModal';

// ==========================================
// ENTERPRISE SEED CATALOG (PRE-LOADED)
// ==========================================
const ENTERPRISE_CATEGORIES = [
  {
    id: 'cat-starters',
    name: 'Starters',
    subCategories: ['All', 'Tandoori & Kebabs', 'Crispy & Fried', 'Tikka Platters']
  },
  {
    id: 'cat-mains',
    name: 'Main Course',
    subCategories: ['All', 'Paneer & Veg Curries', 'Dal & Lentils', 'Breads & Rotis', 'Rice & Biryani']
  },
  {
    id: 'cat-chinese',
    name: 'Chinese & Bowls',
    subCategories: ['All', 'Noodles & Fried Rice', 'Gravies & Manchurian', 'Dim Sums & Baos']
  },
  {
    id: 'cat-beverages',
    name: 'Beverages',
    subCategories: ['All', 'Mocktails & Coolers', 'Shakes & Frappes', 'Hot Brews']
  },
  {
    id: 'cat-desserts',
    name: 'Desserts',
    subCategories: ['All', 'Traditional Indian', 'Ice Creams & Sundaes', 'Cakes & Pastries']
  }
];

const ENTERPRISE_MENU_ITEMS = [
  // STARTERS
  {
    id: 'dish-pta',
    name: 'Paneer Tikka Angara',
    shortcode: 'PTA',
    category_id: 'cat-starters',
    category_name: 'Starters',
    sub_category: 'Tandoori & Kebabs',
    station: 'STATION_KITCHEN',
    price: 280,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock', // in_stock, low_stock, out_of_stock
    stock_count: 24,
    description: 'Clay-oven smoked cottage cheese marinated in fiery Mathania chillies',
    variants: [
      { name: 'Regular Portion', price: 280, delta: 0 },
      { name: 'Platter Portion', price: 420, delta: 140 }
    ],
    add_ons: [
      { name: 'Extra Mint Chutney', price: 20 },
      { name: 'Extra Spiced Onions', price: 15 }
    ]
  },
  {
    id: 'dish-mmt',
    name: 'Murgh Malai Tikka',
    shortcode: 'MMT',
    category_id: 'cat-starters',
    category_name: 'Starters',
    sub_category: 'Tikka Platters',
    station: 'STATION_KITCHEN',
    price: 340,
    is_veg: false,
    is_available: true,
    stock_status: 'low_stock',
    stock_count: 3,
    description: 'Tender chicken morsels in velvet cheese, green cardamom & roasted garlic',
    variants: [
      { name: 'Half (4 pcs)', price: 340, delta: 0 },
      { name: 'Full (8 pcs)', price: 560, delta: 220 }
    ],
    add_ons: [{ name: 'Roomali Roti Combo', price: 45 }]
  },
  {
    id: 'dish-csp',
    name: 'Crispy Corn Salt & Pepper',
    shortcode: 'CSP',
    category_id: 'cat-starters',
    category_name: 'Starters',
    sub_category: 'Crispy & Fried',
    station: 'STATION_KITCHEN',
    price: 220,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 18,
    description: 'Golden American corn tossed with cracked pepper, spring onions & bell peppers',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-aff',
    name: 'Amritsari Fish Fry',
    shortcode: 'AFF',
    category_id: 'cat-starters',
    category_name: 'Starters',
    sub_category: 'Crispy & Fried',
    station: 'STATION_KITCHEN',
    price: 390,
    is_veg: false,
    is_available: false,
    stock_status: 'out_of_stock',
    stock_count: 0,
    description: 'Crispy carom-seed spiced river sole fillets with tart tartar dip',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-dkk',
    name: 'Dahi Ke Kebabs',
    shortcode: 'DKK',
    category_id: 'cat-starters',
    category_name: 'Starters',
    sub_category: 'Tandoori & Kebabs',
    station: 'STATION_KITCHEN',
    price: 260,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 12,
    description: 'Melt-in-mouth hung curd patties infused with fresh herbs and crushed coriander',
    variants: [],
    add_ons: []
  },

  // MAIN COURSE
  {
    id: 'dish-bc',
    name: 'Butter Chicken Old Delhi Style',
    shortcode: 'BC',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Paneer & Veg Curries',
    station: 'STATION_KITCHEN',
    price: 380,
    is_veg: false,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 22,
    description: 'Smoked pulled tandoori chicken simmered in rich creamy tomato silk makhani',
    variants: [
      { name: 'Half Handi', price: 380, delta: 0 },
      { name: 'Full Handi', price: 650, delta: 270 }
    ],
    add_ons: [{ name: 'Extra Butter Dollop', price: 30 }]
  },
  {
    id: 'dish-pbm',
    name: 'Paneer Butter Masala',
    shortcode: 'PBM',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Paneer & Veg Curries',
    station: 'STATION_KITCHEN',
    price: 310,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 25,
    description: 'Slow-simmered malai paneer cubes in velvety cashew tomato gravy',
    variants: [
      { name: 'Regular (2 Portions)', price: 310, delta: 0 },
      { name: 'Jumbo Bowl (4 Portions)', price: 460, delta: 150 }
    ],
    add_ons: [{ name: 'Extra Paneer Cubes (60g)', price: 60 }]
  },
  {
    id: 'dish-dm',
    name: 'Dal Makhani Bukhara',
    shortcode: 'DAL',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Dal & Lentils',
    station: 'STATION_KITCHEN',
    price: 260,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 30,
    description: '24-hour slow coal-simmered black urad lentils infused with white butter',
    variants: [],
    add_ons: [{ name: 'Desi Ghee Tadka', price: 35 }]
  },
  {
    id: 'dish-ydt',
    name: 'Yellow Dal Tadka',
    shortcode: 'YDT',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Dal & Lentils',
    station: 'STATION_KITCHEN',
    price: 210,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 20,
    description: 'Arhar lentils tempered with double cumin, garlic and Kashmiri dry red chillies',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-bn',
    name: 'Butter Naan',
    shortcode: 'NAAN',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Breads & Rotis',
    station: 'STATION_KITCHEN',
    price: 60,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 100,
    description: 'Crispy layered tandoor baked leavened bread brushed with Amul butter',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-gn',
    name: 'Garlic Butter Naan',
    shortcode: 'GN',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Breads & Rotis',
    station: 'STATION_KITCHEN',
    price: 80,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 85,
    description: 'Infused with roasted garlic cloves and fresh coriander sprigs',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-bbr',
    name: 'Dum Pukht Chicken Biryani',
    shortcode: 'BBR',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Rice & Biryani',
    station: 'STATION_KITCHEN',
    price: 350,
    is_veg: false,
    is_available: true,
    stock_status: 'low_stock',
    stock_count: 4,
    description: 'Fragrant aged long-grain basmati sealed in clay pot with saffron & fried onions',
    variants: [
      { name: 'Half Handi', price: 350, delta: 0 },
      { name: 'Full Handi', price: 580, delta: 230 }
    ],
    add_ons: [{ name: 'Extra Burani Raita', price: 40 }]
  },
  {
    id: 'dish-sdb',
    name: 'Subz Dum Biryani',
    shortcode: 'SDB',
    category_id: 'cat-mains',
    category_name: 'Main Course',
    sub_category: 'Rice & Biryani',
    station: 'STATION_KITCHEN',
    price: 290,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 14,
    description: 'Seasonal vegetables, paneer and fragrant spices layered under dough seal',
    variants: [
      { name: 'Half Handi', price: 290, delta: 0 },
      { name: 'Full Handi', price: 480, delta: 190 }
    ],
    add_ons: []
  },

  // CHINESE & BOWLS
  {
    id: 'dish-vhn',
    name: 'Veg Hakka Noodles',
    shortcode: 'VHN',
    category_id: 'cat-chinese',
    category_name: 'Chinese & Bowls',
    sub_category: 'Noodles & Fried Rice',
    station: 'STATION_KITCHEN',
    price: 210,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 28,
    description: 'Wok-tossed noodles with shredded cabbage, bell peppers and light soy sauce',
    variants: [],
    add_ons: [{ name: 'Extra Schezwan Dip', price: 25 }]
  },
  {
    id: 'dish-vmd',
    name: 'Veg Manchurian Dry',
    shortcode: 'VMD',
    category_id: 'cat-chinese',
    category_name: 'Chinese & Bowls',
    sub_category: 'Gravies & Manchurian',
    station: 'STATION_KITCHEN',
    price: 230,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 16,
    description: 'Crisp vegetable dumplings glazed in spicy ginger garlic and dark soy reduction',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-sds',
    name: 'Steamed Edamame & Corn Dim Sum',
    shortcode: 'SDS',
    category_id: 'cat-chinese',
    category_name: 'Chinese & Bowls',
    sub_category: 'Dim Sums & Baos',
    station: 'STATION_KITCHEN',
    price: 240,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 15,
    description: 'Translucent crystal dumplings steamed in bamboo baskets with chilli oil',
    variants: [
      { name: '6 Pieces', price: 240, delta: 0 },
      { name: '12 Pieces', price: 420, delta: 180 }
    ],
    add_ons: []
  },

  // BEVERAGES (STATION_BAR)
  {
    id: 'dish-vmm',
    name: 'Virgin Mint Mojito',
    shortcode: 'MOJ',
    category_id: 'cat-beverages',
    category_name: 'Beverages',
    sub_category: 'Mocktails & Coolers',
    station: 'STATION_BAR',
    price: 160,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 50,
    description: 'Muddled fresh garden mint, Persian lime, cane sugar and sparkling club soda',
    variants: [
      { name: 'Regular 330ml', price: 160, delta: 0 },
      { name: 'Pitcher 1000ml', price: 400, delta: 240 }
    ],
    add_ons: []
  },
  {
    id: 'dish-blc',
    name: 'Blue Lagoon Cooler',
    shortcode: 'BLC',
    category_id: 'cat-beverages',
    category_name: 'Beverages',
    sub_category: 'Mocktails & Coolers',
    station: 'STATION_BAR',
    price: 170,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 35,
    description: 'Curacao orange blossom with lemon spritz, crushed ice and mint sprig',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-bcs',
    name: 'Belgian Dark Chocolate Shake',
    shortcode: 'SHK',
    category_id: 'cat-beverages',
    category_name: 'Beverages',
    sub_category: 'Shakes & Frappes',
    station: 'STATION_BAR',
    price: 210,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 20,
    description: 'Rich 70% dark cocoa blended with whole milk and chocolate fudge swirl',
    variants: [
      { name: 'Regular (350ml)', price: 210, delta: 0 },
      { name: 'Thick Monster (500ml)', price: 270, delta: 60 }
    ],
    add_ons: [{ name: 'Whipped Cream', price: 30 }]
  },
  {
    id: 'dish-eds',
    name: 'Espresso Double Shot',
    shortcode: 'EDS',
    category_id: 'cat-beverages',
    category_name: 'Beverages',
    sub_category: 'Hot Brews',
    station: 'STATION_BAR',
    price: 130,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 60,
    description: 'Dark roasted Arabica beans pulled at 9 bars of pressure with thick golden crema',
    variants: [],
    add_ons: []
  },

  // DESSERTS (STATION_PANTRY)
  {
    id: 'dish-gjr',
    name: 'Gulab Jamun with Rabdi',
    shortcode: 'GUL',
    category_id: 'cat-desserts',
    category_name: 'Desserts',
    sub_category: 'Traditional Indian',
    station: 'STATION_PANTRY',
    price: 140,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 25,
    description: 'Warm khoya dumplings served atop saffron-infused chilled lachha rabdi',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-srm',
    name: 'Shahi Rasmalai (2 Pcs)',
    shortcode: 'RAS',
    category_id: 'cat-desserts',
    category_name: 'Desserts',
    sub_category: 'Traditional Indian',
    station: 'STATION_PANTRY',
    price: 160,
    is_veg: true,
    is_available: true,
    stock_status: 'low_stock',
    stock_count: 2,
    description: 'Spongy chenna discs poached in cardamom and pistachio condensed milk',
    variants: [],
    add_ons: []
  },
  {
    id: 'dish-sbs',
    name: 'Sizzling Brownie Sundae',
    shortcode: 'BRO',
    category_id: 'cat-desserts',
    category_name: 'Desserts',
    sub_category: 'Ice Creams & Sundaes',
    station: 'STATION_PANTRY',
    price: 230,
    is_veg: true,
    is_available: true,
    stock_status: 'in_stock',
    stock_count: 14,
    description: 'Cast-iron sizzler with walnut brownie, Madagascar vanilla scoop & boiling fudge',
    variants: [
      { name: 'Single Scoop Vanilla', price: 230, delta: 0 },
      { name: 'Double Scoop Hot Fudge', price: 300, delta: 70 }
    ],
    add_ons: [{ name: 'Toasted Almond Flakes', price: 25 }]
  },
  {
    id: 'dish-rvp',
    name: 'Red Velvet Pastry',
    shortcode: 'RVP',
    category_id: 'cat-desserts',
    category_name: 'Desserts',
    sub_category: 'Cakes & Pastries',
    station: 'STATION_PANTRY',
    price: 180,
    is_veg: true,
    is_available: false,
    stock_status: 'out_of_stock',
    stock_count: 0,
    description: 'Moist crimson sponge layered with cream cheese frosting',
    variants: [],
    add_ons: []
  }
];

const PREDEFINED_MODIFIERS = [
  { label: 'Less Spicy', price: 0 },
  { label: 'Extra Spicy', price: 0 },
  { label: 'Extra Cheese', price: 40 },
  { label: 'No Onion / Garlic', price: 0 },
  { label: 'Crispy & Well Done', price: 0 },
  { label: 'Pack Gravy Separately', price: 0 }
];

const DINE_IN_TABLES = [
  { id: 't1', table_number: 'T01', capacity: 2, status: 'occupied' },
  { id: 't2', table_number: 'T02', capacity: 4, status: 'available' },
  { id: 't3', table_number: 'T03', capacity: 4, status: 'available' },
  { id: 't4', table_number: 'T04', capacity: 6, status: 'available' },
  { id: 't5', table_number: 'T05', capacity: 2, status: 'occupied' },
  { id: 't6', table_number: 'T06', capacity: 8, status: 'available' },
  { id: 't7', table_number: 'T07', capacity: 4, status: 'available' },
  { id: 't8', table_number: 'T08', capacity: 4, status: 'available' }
];

export default function POSPage() {
  const { showToast } = useToast();
  const searchInputRef = useRef(null);

  // Layout & View Mode (Cards Grid vs Compact Fast-Billing List)
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'
  const [isOffline, setIsOffline] = useState(false);

  // Categories & Sub-Categories
  const [categories, setCategories] = useState(ENTERPRISE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');

  // Menu items & Filtering
  const [menuItems, setMenuItems] = useState(ENTERPRISE_MENU_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [stationFilter, setStationFilter] = useState('ALL'); // ALL | STATION_KITCHEN | STATION_BAR | STATION_PANTRY
  const [loading, setLoading] = useState(false);

  // Order Channel & Multi-Channel Pricing
  // 'dine-in' (Base), 'takeaway' (+₹15 packing), 'delivery' (+15% aggregator markup)
  const [orderChannel, setOrderChannel] = useState('dine-in');

  // Active Order / Cart State
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('T01');
  const [tablesList, setTablesList] = useState(DINE_IN_TABLES);
  const [customersList, setCustomersList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [sentKOTItemCount, setSentKOTItemCount] = useState(0);

  // Held Orders Queue
  const [heldOrders, setHeldOrders] = useState([]);

  // Modals & Micro-Selectors
  const [variantModalItem, setVariantModalItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedVariantAddOns, setSelectedVariantAddOns] = useState([]);

  // Item Modifier Popover / Drawer (for cart item instruction)
  const [modifyingCartIndex, setModifyingCartIndex] = useState(null);
  const [activeModifiers, setActiveModifiers] = useState([]);
  const [activeChefNote, setActiveChefNote] = useState('');

  // Table Operations Modal (Transfer & Merge)
  const [tableOpsModalOpen, setTableOpsModalOpen] = useState(false);
  const [tableOpsType, setTableOpsType] = useState('transfer'); // 'transfer' | 'merge'
  const [targetTableId, setTargetTableId] = useState('');

  // Settlement & Split Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'card' | 'split'
  const [cashTendered, setCashTendered] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitDigitalAmount, setSplitDigitalAmount] = useState('');

  // Discount Modal
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState(0);

  // Thermal Slip & KOT Print Previews
  const [thermalReceiptOrder, setThermalReceiptOrder] = useState(null);
  const [thermalPrintStation, setThermalPrintStation] = useState('ALL'); // ALL | STATION_KITCHEN | STATION_BAR | STATION_PANTRY | BILL
  const [pinModalConfig, setPinModalConfig] = useState(null);
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // 1. Initial Catalog & Data Fetching
  const fetchData = async () => {
    try {
      const [catsRes, itemsRes, tablesRes, custsRes, availRes] = await Promise.all([
        api.get('/menu/categories').catch(() => ({ data: [] })),
        api.get('/menu/items').catch(() => ({ data: [] })),
        api.get('/tables').catch(() => ({ data: [] })),
        api.get('/customers').catch(() => ({ data: [] })),
        api.get('/menu/availability').catch(() => ({ data: [] }))
      ]);

      const availMap = new Map();
      if (availRes.data && Array.isArray(availRes.data)) {
        availRes.data.forEach((av) => {
          if (av.menu_item_id) availMap.set(av.menu_item_id, av);
          if (av.menu_item_name) availMap.set(av.menu_item_name.toLowerCase(), av);
        });
      }

      if (catsRes.data && catsRes.data.length > 0) {
        // Merge API categories with our subcategories schema
        const mergedCats = catsRes.data.map((c) => {
          const found = ENTERPRISE_CATEGORIES.find((ec) => ec.name.toLowerCase() === c.name.toLowerCase() || ec.id === c.id);
          return {
            ...c,
            subCategories: found ? found.subCategories : ['All', 'Signature Dishes', 'Specialties']
          };
        });
        setCategories(mergedCats);
      }

      // Base items to merge: prioritize backend items, fallback to enterprise seed items
      const rawItemList = itemsRes.data && itemsRes.data.length > 0 ? itemsRes.data : ENTERPRISE_MENU_ITEMS;

      const enriched = rawItemList.map((item, idx) => {
        const seedMatch = ENTERPRISE_MENU_ITEMS.find((s) => s.name.toLowerCase() === item.name.toLowerCase());
        const shortcode = item.shortcode || seedMatch?.shortcode || item.name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() || `IT${idx}`;
        const subCategory = item.sub_category || seedMatch?.sub_category || 'All';
        const station = item.station || seedMatch?.station || 'STATION_KITCHEN';

        // Match with recipe availability
        const availInfo = availMap.get(item.id) || availMap.get(item.name?.toLowerCase());
        const sellableQuantity = availInfo ? availInfo.sellable_quantity : (item.stock_count ?? (item.is_available === false ? 0 : 20));
        const limitingIngredient = availInfo?.limiting_ingredient || null;
        const staffReason = availInfo?.staff_reason || (sellableQuantity === 0 ? `${item.name} unavailable — insufficient ingredient stock` : null);
        const isAvail = availInfo ? (availInfo.is_available && sellableQuantity > 0) : (item.is_available !== false && sellableQuantity > 0);
        const stockStatus = (!isAvail || sellableQuantity === 0) ? 'out_of_stock' : (sellableQuantity <= 5 ? 'low_stock' : 'in_stock');

        return {
          ...item,
          shortcode,
          sub_category: subCategory,
          station,
          stock_status: stockStatus,
          stock_count: sellableQuantity,
          sellable_quantity: sellableQuantity,
          limiting_ingredient: limitingIngredient,
          staff_reason: staffReason,
          is_available: isAvail,
          variants: item.variants && item.variants.length > 0 ? item.variants : seedMatch?.variants || [],
          add_ons: item.add_ons && item.add_ons.length > 0 ? item.add_ons : seedMatch?.add_ons || []
        };
      });

      setMenuItems(enriched);

      if (tablesRes.data && tablesRes.data.length > 0) {
        setTablesList(tablesRes.data);
      }

      if (custsRes.data && custsRes.data.length > 0) {
        setCustomersList(custsRes.data);
      }
    } catch (err) {
      console.warn('Using enterprise offline catalog fallback', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Global Hotkey Listeners (Keyboard-Only Cashier Operations)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input unless it's Esc or specific shortcuts
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if (e.key === 'Escape') {
        setVariantModalItem(null);
        setModifyingCartIndex(null);
        setPaymentModalOpen(false);
        setTableOpsModalOpen(false);
        setDiscountModalOpen(false);
        setNewCustomerModal(false);
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
        return;
      }

      if (e.key === 'F2' || (!isInput && e.key === '/')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        setVegOnly((prev) => !prev);
        showToast(`Veg Only filter: ${!vegOnly ? 'ENABLED' : 'DISABLED'}`, 'info', 1200);
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        handleSendKOT();
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        handleOpenCharge();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vegOnly, cart]);

  // 3. Multi-Channel Item Price Calculator
  const getItemPrice = (basePrice) => {
    const priceNum = Number(basePrice) || 0;
    if (orderChannel === 'takeaway') {
      return priceNum; // packing fee handled at checkout or per item
    }
    if (orderChannel === 'delivery') {
      // 15% Aggregator commission markup
      return Math.round(priceNum * 1.15);
    }
    return priceNum;
  };

  // 4. Sub-Categories for currently selected category
  const activeSubCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return ['All'];
    }
    const cat = categories.find((c) => c.id === selectedCategory || c.name === selectedCategory);
    return cat?.subCategories || ['All'];
  }, [selectedCategory, categories]);

  // 5. Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'all') {
        const matchesCat = item.category_id === selectedCategory || item.category_name?.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchesCat) return false;
      }
      if (selectedSubCategory !== 'All') {
        if (item.sub_category !== selectedSubCategory) return false;
      }
      if (vegOnly && !item.is_veg) return false;
      if (stationFilter !== 'ALL' && item.station !== stationFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesShortcode = item.shortcode.toLowerCase() === query;
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCodePartial = item.shortcode.toLowerCase().includes(query);
        if (!matchesShortcode && !matchesName && !matchesCodePartial) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, selectedSubCategory, vegOnly, stationFilter, searchQuery]);

  // 6. Real-time active item counts for Category Pills & Sub-Categories
  const getCategoryCount = (catId) => {
    if (catId === 'all') return menuItems.filter((i) => (vegOnly ? i.is_veg : true)).length;
    return menuItems.filter((i) => {
      const match = i.category_id === catId || i.category_name?.toLowerCase() === catId.toLowerCase();
      if (!match) return false;
      if (vegOnly && !i.is_veg) return false;
      return true;
    }).length;
  };

  const getSubCategoryCount = (subName) => {
    return menuItems.filter((i) => {
      if (selectedCategory !== 'all') {
        const matchCat = i.category_id === selectedCategory || i.category_name?.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchCat) return false;
      }
      if (subName !== 'All' && i.sub_category !== subName) return false;
      if (vegOnly && !i.is_veg) return false;
      return true;
    }).length;
  };

  // 7. High-Speed Cashier Shortcode Enter Key Punch
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim().toUpperCase();
      // Try exact shortcode match first
      let matchedItem = menuItems.find((i) => i.shortcode.toUpperCase() === code);
      if (!matchedItem) {
        // Try exact name match or first partial match
        matchedItem = menuItems.find((i) => i.name.toLowerCase() === searchQuery.trim().toLowerCase()) || filteredItems[0];
      }

      if (matchedItem) {
        if (matchedItem.stock_status === 'out_of_stock' || matchedItem.is_available === false) {
          showToast(`❌ ${matchedItem.name} [${matchedItem.shortcode}] is 86'd / Sold Out!`, 'warning');
          return;
        }

        if (matchedItem.variants && matchedItem.variants.length > 0) {
          openVariantModal(matchedItem);
          showToast(`Select portion size for ${matchedItem.name}`, 'info', 1200);
        } else {
          addToCart(matchedItem);
          showToast(`⚡ Added [${matchedItem.shortcode}] ${matchedItem.name}`, 'success', 1200);
        }
        setSearchQuery('');
      } else {
        showToast(`No dish found matching code "${code}"`, 'warning', 1500);
      }
    }
  };

  // 8. Add to Cart Logic with In-Card Stepper & Variants
  const addToCart = (item, variant = null, addOns = []) => {
    const isOutOfStock = item.stock_status === 'out_of_stock' || item.is_available === false || (item.sellable_quantity !== undefined && item.sellable_quantity <= 0);
    if (isOutOfStock) {
      showToast(item.staff_reason || `Cannot add sold-out item: ${item.name}`, 'warning');
      return;
    }

    const currentQtyInCart = getItemCartQuantity(item.id);
    const maxAllowed = item.sellable_quantity !== undefined ? item.sellable_quantity : (item.stock_count ?? 999);
    if (currentQtyInCart + 1 > maxAllowed) {
      showToast(`Only ${maxAllowed} ${item.name} available based on current ingredient stock.`, 'warning');
      return;
    }

    const baseUnitRate = variant ? (Number(variant.price) || Number(item.price)) : Number(item.price);
    const channelAdjustedPrice = getItemPrice(baseUnitRate);
    const addOnsTotal = addOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const finalItemPrice = channelAdjustedPrice + addOnsTotal;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.id === item.id && ci.variant === (variant?.name || null) && ci.addOns.length === addOns.length && ci.addOns.every((a, idx) => a === addOns[idx]?.name)
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          shortcode: item.shortcode,
          station: item.station || 'STATION_KITCHEN',
          basePrice: baseUnitRate,
          price: finalItemPrice,
          quantity: 1,
          variant: variant?.name || null,
          addOns: addOns.map((a) => a.name),
          modifiers: [],
          notes: '',
          isNewToKOT: true
        }
      ];
    });
  };

  const updateCartQuantity = (cartIndex, delta) => {
    const cartItem = cart[cartIndex];
    if (!cartItem) return;

    if (delta > 0) {
      const menuItem = menuItems.find((m) => m.id === cartItem.id);
      const currentTotalForThisItem = getItemCartQuantity(cartItem.id);
      const maxAllowed = menuItem?.sellable_quantity !== undefined ? menuItem.sellable_quantity : (menuItem?.stock_count ?? 999);
      if (currentTotalForThisItem + delta > maxAllowed) {
        showToast(`Only ${maxAllowed} ${cartItem.name} available based on current ingredient stock.`, 'warning');
        return;
      }
    }

    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[cartIndex].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, idx) => idx !== cartIndex);
      }
      copy[cartIndex].quantity = newQty;
      return copy;
    });
  };

  // Find item quantity in active cart for in-card stepper
  const getItemCartQuantity = (itemId) => {
    return cart.filter((c) => c.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  const handleInCardAddOrStep = (item, delta = 1) => {
    const isOutOfStock = item.stock_status === 'out_of_stock' || item.is_available === false || (item.sellable_quantity !== undefined && item.sellable_quantity <= 0);
    if (isOutOfStock) {
      showToast(item.staff_reason || `${item.name} is currently out of stock.`, 'warning');
      return;
    }

    if (item.variants && item.variants.length > 0) {
      openVariantModal(item);
      return;
    }

    const currentQty = getItemCartQuantity(item.id);
    const maxAllowed = item.sellable_quantity !== undefined ? item.sellable_quantity : (item.stock_count ?? 999);
    if (delta > 0 && currentQty + delta > maxAllowed) {
      showToast(`Only ${maxAllowed} ${item.name} available based on current ingredient stock.`, 'warning');
      return;
    }

    const existingIdx = cart.findIndex((c) => c.id === item.id && !c.variant);
    if (existingIdx > -1) {
      updateCartQuantity(existingIdx, delta);
    } else if (delta > 0) {
      addToCart(item);
    }
  };

  // 9. Variant Drawer / Modal Handlers
  const openVariantModal = (item) => {
    setVariantModalItem(item);
    setSelectedVariant(item.variants?.[0] || null);
    setSelectedVariantAddOns([]);
  };

  const handleConfirmVariantAdd = () => {
    if (!variantModalItem) return;
    addToCart(variantModalItem, selectedVariant, selectedVariantAddOns);
    showToast(`Added ${variantModalItem.name} (${selectedVariant?.name || 'Portion'})`, 'info', 1200);
    setVariantModalItem(null);
  };

  // 10. Item Modifiers & KOT Special Instructions Popover
  const openModifierPopover = (index) => {
    const item = cart[index];
    setModifyingCartIndex(index);
    setActiveModifiers(item.modifiers || []);
    setActiveChefNote(item.notes || '');
  };

  const toggleModifier = (modLabel, extraPrice = 0) => {
    setActiveModifiers((prev) => {
      const exists = prev.find((m) => m.label === modLabel);
      if (exists) {
        return prev.filter((m) => m.label !== modLabel);
      }
      return [...prev, { label: modLabel, price: extraPrice }];
    });
  };

  const saveItemModifiers = () => {
    if (modifyingCartIndex === null) return;
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[modifyingCartIndex];
      const modCost = activeModifiers.reduce((sum, m) => sum + (m.price || 0), 0);
      const originalBase = item.basePrice || item.price;
      const channelBase = getItemPrice(originalBase);
      item.modifiers = activeModifiers;
      item.notes = activeChefNote;
      item.price = channelBase + modCost;
      return copy;
    });
    setModifyingCartIndex(null);
    showToast('Kitchen modifier tags updated', 'success', 1000);
  };

  // 11. Cart Totals & Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const packagingCharge = orderChannel === 'takeaway' ? cart.reduce((acc, it) => acc + 15 * it.quantity, 0) : 0;
  const grossSubtotal = subtotal + packagingCharge;
  const discountAmount = Math.round((grossSubtotal * discountPercent) / 100);
  const taxable = Math.max(0, grossSubtotal - discountAmount);
  const cgst = parseFloat(((taxable * 2.5) / 100).toFixed(2));
  const sgst = parseFloat(((taxable * 2.5) / 100).toFixed(2));
  const tax = parseFloat((cgst + sgst).toFixed(2));
  const grandTotal = Math.round(taxable + tax);

  // New items ready to fire to KOT
  const newKOTItemsCount = cart.filter((i) => i.isNewToKOT).reduce((sum, i) => sum + i.quantity, 0);

  // 12. Send KOT (Separates items by STATION_KITCHEN, STATION_BAR, STATION_PANTRY)
  const handleSendKOT = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Punch dishes before sending KOT.', 'warning');
      return;
    }

    // Shared Ingredient Cart-Level Validation before firing KOT
    try {
      const cartItemsPayload = cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity }));
      const valRes = await api.post('/menu/validate-cart', { items: cartItemsPayload });
      if (valRes.data && !valRes.data.is_valid) {
        const shortage = valRes.data.shortages?.[0];
        showToast(`Insufficient stock to complete this order: ${shortage?.message || 'Ingredients depleted'}`, 'error', 4500);
        return;
      }
    } catch (valErr) {
      console.warn('Cart validation bypassed on offline mode', valErr);
    }

    try {
      const stationGroups = {
        STATION_KITCHEN: cart.filter((i) => i.station === 'STATION_KITCHEN' || !i.station),
        STATION_BAR: cart.filter((i) => i.station === 'STATION_BAR'),
        STATION_PANTRY: cart.filter((i) => i.station === 'STATION_PANTRY')
      };

      const matchedTable = tablesList.find(t => t.table_number === selectedTable || t.id === selectedTable);
      const cleanNum = (matchedTable?.table_number || selectedTable).replace(/^T-?/i, '');
      const formattedTableName = orderChannel === 'dine-in' ? `Table ${cleanNum}` : orderChannel.toUpperCase();

      const kotPayload = {
        order_type: orderChannel,
        table_id: matchedTable ? matchedTable.id : null,
        table_name: formattedTableName,
        station_routes: {
          kitchen_count: stationGroups.STATION_KITCHEN.length,
          bar_count: stationGroups.STATION_BAR.length,
          pantry_count: stationGroups.STATION_PANTRY.length
        },
        items: cart.map((it) => ({
          menuItemId: it.id,
          name: it.name,
          shortcode: it.shortcode,
          station: it.station,
          price: it.price,
          quantity: it.quantity,
          variant: it.variant,
          modifiers: it.modifiers || [],
          notes: it.notes || ''
        })),
        notes: orderNotes
      };

      if (!isOffline) {
        await api.post('/orders', kotPayload).catch((e) => console.log('Simulated offline dispatch', e));
        // Immediately refresh availability after inventory auto-deduction
        fetchData();
      }

      // Mark all cart items as dispatched
      setCart((prev) => prev.map((item) => ({ ...item, isNewToKOT: false })));
      setSentKOTItemCount((prev) => prev + newKOTItemsCount);

      showToast(`🔥 KOT Fired! Routed to Kitchen (${stationGroups.STATION_KITCHEN.length}), Bar (${stationGroups.STATION_BAR.length}), Pantry (${stationGroups.STATION_PANTRY.length})`, 'success');

      // Auto-launch thermal receipt preview configured to KOT
      setThermalReceiptOrder({
        id: `KOT-${Date.now().toString().slice(-4)}`,
        table_name: orderChannel === 'dine-in' ? `Table ${selectedTable}` : orderChannel.toUpperCase(),
        order_type: orderChannel,
        items: cart,
        notes: orderNotes,
        created_at: new Date().toISOString()
      });
      setThermalPrintStation('ALL');
    } catch (err) {
      showToast('Error sending KOT to kitchen printers', 'error');
    }
  };

  // 13. Hold & Restore Orders
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Nothing to hold.', 'warning');
      return;
    }
    const held = {
      id: `hold-${Date.now()}`,
      cart,
      orderChannel,
      selectedTable,
      selectedCustomer,
      discountPercent,
      orderNotes,
      subtotal: grandTotal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHeldOrders((prev) => [...prev, held]);
    setCart([]);
    showToast(`Order held for ${selectedTable || orderChannel}`, 'info');
  };

  const handleRestoreHold = (held) => {
    setCart(held.cart);
    setOrderChannel(held.orderChannel);
    setSelectedTable(held.selectedTable);
    setSelectedCustomer(held.selectedCustomer);
    setDiscountPercent(held.discountPercent);
    setOrderNotes(held.orderNotes);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    showToast('Held order restored to active billing counter', 'success');
  };

  // 14. Void Order (Manager PIN Authorization)
  const handleVoidOrder = () => {
    if (cart.length === 0) return;
    setPinModalConfig({
      actionTitle: 'Manager Authorization: Void Order',
      actionDescription: `Voiding ${cart.length} item(s) worth ₹${grandTotal}. Enter 4-digit Manager PIN (1234) to authorize.`,
      onSuccess: () => {
        setCart([]);
        setDiscountPercent(0);
        setOrderNotes('');
        setPinModalConfig(null);
        showToast('Active ticket successfully voided by manager', 'info');
      }
    });
  };

  // 15. Table Operations (Transfer / Merge)
  const handleOpenTableOps = (type) => {
    setTableOpsType(type);
    setTargetTableId('');
    setTableOpsModalOpen(true);
  };

  const handleExecuteTableOps = () => {
    if (!targetTableId) {
      showToast('Please select a target table', 'warning');
      return;
    }
    if (tableOpsType === 'transfer') {
      const prevTable = selectedTable;
      setSelectedTable(targetTableId);
      setTableOpsModalOpen(false);
      showToast(`Transferred active KOTs & items from ${prevTable} to ${targetTableId}`, 'success');
    } else {
      setTableOpsModalOpen(false);
      showToast(`Merged ${selectedTable} and ${targetTableId} into a unified settlement chit`, 'success');
    }
  };

  // 16. Charge & Split Tender Settlement
  const handleOpenCharge = () => {
    if (cart.length === 0) {
      showToast('Cannot settle an empty order. Punch dishes first.', 'warning');
      return;
    }
    setPaymentMethod('cash');
    setCashTendered(String(grandTotal));
    const half = Math.round(grandTotal / 2);
    setSplitCashAmount(String(half));
    setSplitDigitalAmount(String(grandTotal - half));
    setPaymentModalOpen(true);
  };

  const handleSplitCashChange = (val) => {
    setSplitCashAmount(val);
    const cashVal = Number(val) || 0;
    const remaining = Math.max(0, grandTotal - cashVal);
    setSplitDigitalAmount(String(remaining));
  };

  const handleCompleteSettlement = async () => {
    try {
      const matchedTable = tablesList.find(t => t.table_number === selectedTable || t.id === selectedTable);
      const cleanNum = (matchedTable?.table_number || selectedTable).replace(/^T-?/i, '');
      const formattedTableName = orderChannel === 'dine-in' ? `Table ${cleanNum}` : orderChannel.toUpperCase();

      const settlementRecord = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        order_type: orderChannel,
        table_id: matchedTable ? matchedTable.id : null,
        table_name: formattedTableName,
        customer_name: selectedCustomer?.name || 'Walk-in Guest',
        customer_phone: selectedCustomer?.phone || '+91 98765 43210',
        items: cart,
        subtotal: grossSubtotal,
        discount: discountAmount,
        cgst,
        sgst,
        tax,
        total: grandTotal,
        status: 'paid',
        payment_status: 'paid',
        payment_method: paymentMethod === 'split' ? `Split (Cash: ₹${splitCashAmount} | UPI: ₹${splitDigitalAmount})` : paymentMethod.toUpperCase(),
        created_at: new Date().toISOString()
      };

      if (!isOffline) {
        // Shared Ingredient Cart-Level Validation before final settlement
        try {
          const cartItemsPayload = cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity }));
          const valRes = await api.post('/menu/validate-cart', { items: cartItemsPayload });
          if (valRes.data && !valRes.data.is_valid) {
            const shortage = valRes.data.shortages?.[0];
            showToast(`Insufficient stock to complete this order: ${shortage?.message || 'Ingredients depleted'}`, 'error', 4500);
            return;
          }
        } catch (vErr) {
          console.warn('Cart validation check warning', vErr);
        }

        await api.post('/orders', settlementRecord).catch((e) => console.log('Offline queue stored', e));
        // Immediately refresh menu & ingredient stock
        fetchData();
      }

      setPaymentModalOpen(false);
      setThermalReceiptOrder(settlementRecord);
      setThermalPrintStation('BILL');
      setCart([]);
      setOrderNotes('');
      setDiscountPercent(0);
      showToast(`Bill settled for ₹${grandTotal}! 80mm tax receipt ready.`, 'success');
    } catch (err) {
      showToast('Error completing bill settlement', 'error');
    }
  };

  // Customer Quick Create
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    const newCust = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone
    };
    setCustomersList((prev) => [newCust, ...prev]);
    setSelectedCustomer(newCust);
    setNewCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    showToast(`Customer ${newCust.name} attached to ticket`, 'success');
  };

  const changeDue = Math.max(0, (Number(cashTendered) || 0) - grandTotal);
  const splitRemaining = Math.max(0, grandTotal - ((Number(splitCashAmount) || 0) + (Number(splitDigitalAmount) || 0)));

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-100 text-slate-800 select-none">
      {/* ============================================================== */}
      {/* TOP BAR: SYSTEM STATUS, ORDER CHANNELS, FAST CONTROLS         */}
      {/* ============================================================== */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Order Channel Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setOrderChannel('dine-in')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderChannel === 'dine-in'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>
            <button
              onClick={() => setOrderChannel('takeaway')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderChannel === 'takeaway'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
            <button
              onClick={() => setOrderChannel('delivery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderChannel === 'delivery'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery (+15%)</span>
            </button>
          </div>

          {/* Network Health & Offline Resilience Pill */}
          <button
            onClick={() => {
              setIsOffline((prev) => !prev);
              showToast(!isOffline ? 'Switched to Local Offline Mode (IndexedDB Active)' : 'Online Cloud Sync Resumed', !isOffline ? 'warning' : 'success');
            }}
            title="Click to toggle offline simulation"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
              !isOffline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
            }`}
          >
            {!isOffline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Cloud Synced</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Offline Mode (Queued Local)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Top Status & Held Orders Dropdown */}
        <div className="flex items-center gap-2">
          {/* Held Orders Button */}
          {heldOrders.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-500/20 cursor-pointer">
                <PauseCircle className="w-4 h-4 text-amber-600" />
                <span>Held ({heldOrders.length})</span>
              </button>
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 hidden group-hover:block z-40">
                <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Restore Parked Ticket</div>
                {heldOrders.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => handleRestoreHold(h)}
                    className="p-2 hover:bg-orange-50 rounded-lg cursor-pointer text-xs flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{h.selectedTable || h.orderChannel}</div>
                      <div className="text-[10px] text-slate-400">{h.time} · {h.cart.length} items</div>
                    </div>
                    <span className="font-extrabold text-orange-600">₹{h.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Cashier Shortcut Helper Badge */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700">Shortcuts:</span>
            <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">F2 /</kbd> Search
            <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] ml-1">F4</kbd> Veg
            <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] ml-1">F8</kbd> KOT
            <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] ml-1">F9</kbd> Settle
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN 3-PANE WORKSPACE                                          */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ============================================================ */}
        {/* PANE 1 (LEFT): CATEGORIES SIDEBAR WITH REAL-TIME BADGES       */}
        {/* ============================================================ */}
        <nav aria-label="Categories" className="w-full lg:w-52 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-2 sm:p-2.5 shrink-0 flex lg:flex-col overflow-x-auto lg:overflow-y-auto space-x-2 lg:space-x-0 lg:space-y-1.5 z-10">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubCategory('All');
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getCategoryCount('all')}
            </span>
          </button>

          {categories.map((cat) => {
            const count = getCategoryCount(cat.id);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubCategory('All');
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0 ml-1.5 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ============================================================ */}
        {/* PANE 2 (CENTER): SUB-CATEGORIES, SEARCH, DISH CATALOG        */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
          {/* Sub-Category Horizontal Pills & Search Toolbar */}
          <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 space-y-2 shrink-0">
            {/* Horizontal Sub-Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {activeSubCategories.map((subName) => {
                const subCount = getSubCategoryCount(subName);
                const isSubSelected = selectedSubCategory === subName;
                return (
                  <button
                    key={subName}
                    onClick={() => setSelectedSubCategory(subName)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSubSelected
                        ? 'bg-slate-800 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{subName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSubSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {subCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fast Cashier Search + Shortcode Punch Bar */}
            <div className="flex items-center gap-2">
              {/* Shortcode / Name Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Type name or shortcode (e.g. PTA, BC, DAL) and hit Enter to punch..."
                  className="w-full pl-9 pr-20 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                    ↵ Enter to add
                  </span>
                </div>
              </div>

              {/* Station Filter Dropdown */}
              <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  onClick={() => setStationFilter('ALL')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    stationFilter === 'ALL' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStationFilter('STATION_KITCHEN')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    stationFilter === 'STATION_KITCHEN' ? 'bg-white shadow-2xs text-orange-700' : 'text-slate-600'
                  }`}
                  title="Kitchen (Tandoor / Mains)"
                >
                  Kitchen
                </button>
                <button
                  onClick={() => setStationFilter('STATION_BAR')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    stationFilter === 'STATION_BAR' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600'
                  }`}
                  title="Bar (Mocktails / Drinks)"
                >
                  Bar
                </button>
                <button
                  onClick={() => setStationFilter('STATION_PANTRY')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    stationFilter === 'STATION_PANTRY' ? 'bg-white shadow-2xs text-purple-700' : 'text-slate-600'
                  }`}
                  title="Pantry (Desserts / Bakery)"
                >
                  Pantry
                </button>
              </div>

              {/* Veg Only Toggle */}
              <button
                onClick={() => setVegOnly((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.8 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  vegOnly
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 flex items-center justify-center p-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </span>
                <span>Veg Only</span>
              </button>

              {/* View Switch: Grid vs Compact Fast-Billing List */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Cards Grid View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  title="Compact Fast-Billing List (25+ items visible)"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'compact' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dish Catalog Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <UtensilsCrossed className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No dishes match active filters</p>
                <p className="text-xs text-slate-400">Clear search or choose another sub-category</p>
              </div>
            ) : viewMode === 'grid' ? (
              /* ================= MODE A: CARDS GRID VIEW ================= */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const isOutOfStock = item.stock_status === 'out_of_stock' || item.is_available === false;
                  const isLowStock = item.stock_status === 'low_stock';
                  const currentCartQty = getItemCartQuantity(item.id);
                  const price = getItemPrice(item.price);
                  const hasVariants = item.variants && item.variants.length > 0;

                  return (
                    <div
                      key={item.id}
                      className={`relative bg-white rounded-xl border transition-all flex flex-col justify-between p-3 overflow-hidden shadow-2xs ${
                        isOutOfStock
                          ? 'border-slate-200 bg-slate-50/70 opacity-75'
                          : 'border-slate-200/80 hover:border-orange-500/50 hover:shadow-md hover:shadow-orange-500/5'
                      }`}
                    >
                      {/* Out of Stock 86'd Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                          <span className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-black uppercase tracking-wider shadow-md">
                            86 / Sold Out
                          </span>
                          {item.staff_reason && (
                            <span className="mt-1.5 text-[10px] font-bold text-red-900 bg-white/95 px-2 py-0.5 rounded shadow-xs max-w-[95%] truncate">
                              {item.staff_reason}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Top Meta: Veg Indicator + Shortcode + Station */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {/* Veg / Non-Veg Icon */}
                            <span
                              className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-sm shrink-0 ${
                                item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                            </span>

                            {/* Shortcode Badge */}
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-extrabold text-slate-700">
                              {item.shortcode}
                            </span>
                          </div>

                          {/* Station Pill */}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              item.station === 'STATION_BAR'
                                ? 'bg-blue-50 text-blue-700'
                                : item.station === 'STATION_PANTRY'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-orange-50 text-orange-700'
                            }`}
                          >
                            {item.station === 'STATION_BAR' ? 'Bar' : item.station === 'STATION_PANTRY' ? 'Pantry' : 'Kitchen'}
                          </span>
                        </div>

                        {/* Dish Name */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.name}
                        </h4>

                        {/* Stock & Availability Pill */}
                        <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            Available: {item.sellable_quantity !== undefined ? item.sellable_quantity : item.stock_count}
                          </span>
                          {item.limiting_ingredient && !isOutOfStock && (
                            <span className="text-[9px] text-amber-700 font-medium truncate max-w-[110px]" title={`Limited by ${item.limiting_ingredient}`}>
                              Limiting: {item.limiting_ingredient}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Price & In-Card Stepper / Add Button */}
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">₹{price}</div>
                          {hasVariants && (
                            <div className="text-[10px] text-orange-600 font-semibold">
                              {item.variants.length} portions
                            </div>
                          )}
                        </div>

                        {/* Add Button or In-Card Active Stepper */}
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                          >
                            Sold Out
                          </button>
                        ) : hasVariants ? (
                          <button
                            onClick={() => openVariantModal(item)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-orange-600/30 transition-all cursor-pointer"
                          >
                            <span>Options</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : currentCartQty > 0 ? (
                          <div className="flex items-center bg-orange-600 text-white rounded-xl overflow-hidden shadow-xs">
                            <button
                              onClick={() => handleInCardAddOrStep(item, -1)}
                              className="px-2 py-1.5 hover:bg-orange-700 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-black min-w-[20px] text-center">
                              {currentCartQty}
                            </span>
                            <button
                              onClick={() => handleInCardAddOrStep(item, 1)}
                              className="px-2 py-1.5 hover:bg-orange-700 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ================= MODE B: COMPACT FAST-BILLING LIST ================= */
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3 w-8">Type</th>
                      <th className="py-2 px-2 w-14">Code</th>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-2 w-24">Station</th>
                      <th className="py-2 px-2 w-20 text-right">Price</th>
                      <th className="py-2 px-3 w-28 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredItems.map((item) => {
                      const isOutOfStock = item.stock_status === 'out_of_stock' || item.is_available === false;
                      const isLowStock = item.stock_status === 'low_stock';
                      const currentCartQty = getItemCartQuantity(item.id);
                      const price = getItemPrice(item.price);
                      const hasVariants = item.variants && item.variants.length > 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-orange-50/40 transition-colors ${
                            isOutOfStock ? 'bg-slate-50/80 opacity-60' : ''
                          }`}
                        >
                          {/* Dot */}
                          <td className="py-2 px-3">
                            <span
                              className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-sm shrink-0 ${
                                item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                            </span>
                          </td>

                          {/* Shortcode */}
                          <td className="py-2 px-2">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-black text-slate-800">
                              {item.shortcode}
                            </span>
                          </td>

                          {/* Name + Subcategory */}
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{item.name}</span>
                              {isLowStock && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 rounded border border-amber-200">
                                  Low: {item.stock_count}
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className="text-[10px] text-red-600 bg-red-50 px-1.5 rounded border border-red-200 font-bold">
                                  86'd
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{item.sub_category}</div>
                          </td>

                          {/* Station */}
                          <td className="py-2 px-2">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.station === 'STATION_BAR'
                                  ? 'bg-blue-50 text-blue-700'
                                  : item.station === 'STATION_PANTRY'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-orange-50 text-orange-700'
                              }`}
                            >
                              {item.station === 'STATION_BAR' ? 'Bar' : item.station === 'STATION_PANTRY' ? 'Pantry' : 'Kitchen'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                            ₹{price}
                          </td>

                          {/* Action / Stepper */}
                          <td className="py-2 px-3 text-center">
                            {isOutOfStock ? (
                              <span className="text-[10px] text-slate-400 font-bold">Sold Out</span>
                            ) : hasVariants ? (
                              <button
                                onClick={() => openVariantModal(item)}
                                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Select
                              </button>
                            ) : currentCartQty > 0 ? (
                              <div className="inline-flex items-center bg-orange-600 text-white rounded-lg overflow-hidden shadow-2xs">
                                <button
                                  onClick={() => handleInCardAddOrStep(item, -1)}
                                  className="px-1.5 py-1 hover:bg-orange-700 cursor-pointer"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="px-1.5 text-xs font-black min-w-[16px] text-center">
                                  {currentCartQty}
                                </span>
                                <button
                                  onClick={() => handleInCardAddOrStep(item, 1)}
                                  className="px-1.5 py-1 hover:bg-orange-700 cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                + Add
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PANE 3 (RIGHT): CART / ACTIVE TICKET & PRIMARY CTAS           */}
        {/* ============================================================ */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-lg z-10">
          {/* Cart Header: Table Info + Table Operations Menu */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              {/* Dine-In Table Selector & Operations */}
              {orderChannel === 'dine-in' ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="text-xs font-extrabold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                    >
                      {tablesList.map((t) => (
                        <option key={t.id || t.table_number} value={t.table_number}>
                          {t.table_number} ({t.capacity || 4} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Table Operations Menu (Transfer / Merge) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenTableOps('transfer')}
                      title="Transfer Table (Move running order)"
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleOpenTableOps('merge')}
                      title="Merge Tables (Combine two bills)"
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      <Merge className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                  <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                  <span>{orderChannel.toUpperCase()} COUNTER</span>
                </div>
              )}

              {/* Void Button */}
              {cart.length > 0 && (
                <button
                  onClick={handleVoidOrder}
                  title="Void active ticket (Requires Manager PIN)"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Guest Assignment Row */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1 text-slate-500 truncate max-w-[200px]">
                <span className="text-[11px] font-semibold">Guest:</span>
                <span className="font-bold text-slate-800 truncate">
                  {selectedCustomer ? `${selectedCustomer.name}` : 'Walk-in Guest'}
                </span>
              </div>
              <button
                onClick={() => setNewCustomerModal(true)}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                {selectedCustomer ? 'Change' : '+ Add Guest'}
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 space-y-1">
                <UtensilsCrossed className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-600">Ticket is empty</p>
                <p className="text-[11px] text-slate-400">
                  Tap dishes or type shortcode (e.g. <kbd className="font-mono bg-slate-100 px-1 border rounded">PTA</kbd>) + Enter
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="bg-slate-50/70 hover:bg-slate-100/70 rounded-xl p-2.5 border border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-[10px] bg-slate-200 px-1 rounded text-slate-700">
                          {item.shortcode}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                      </div>

                      {/* Portion / Variant Tag */}
                      {item.variant && (
                        <div className="text-[11px] font-semibold text-orange-700 mt-0.5">
                          Portion: {item.variant}
                        </div>
                      )}

                      {/* Modifiers List (Amber Italic Chips) */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.modifiers.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="text-[10px] font-medium italic text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200"
                            >
                              * {m.label} {m.price > 0 && `(+₹${m.price})`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Chef Note */}
                      {item.notes && (
                        <div className="text-[10px] italic text-slate-500 mt-0.5">
                          Note: "{item.notes}"
                        </div>
                      )}

                      {/* Modifier Trigger Button */}
                      <button
                        onClick={() => openModifierPopover(idx)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700 mt-1 cursor-pointer"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>Instructions / Modifiers</span>
                      </button>
                    </div>

                    {/* Price & Stepper */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-xs font-black text-slate-900">
                        ₹{item.price * item.quantity}
                      </span>
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateCartQuantity(idx, -1)}
                          className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(idx, 1)}
                          className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Summary & Discount */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">₹{subtotal}</span>
            </div>

            {orderChannel === 'takeaway' && (
              <div className="flex justify-between text-slate-600">
                <span>Packaging Charge (₹15/item)</span>
                <span className="font-bold text-slate-800">₹{packagingCharge}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 items-center">
              <button
                onClick={() => setDiscountModalOpen(true)}
                className="text-orange-600 font-bold hover:underline cursor-pointer"
              >
                Discount {discountPercent > 0 && `(${discountPercent}%)`}
              </button>
              <span className="font-bold text-emerald-700">
                {discountAmount > 0 ? `-₹${discountAmount}` : '₹0'}
              </span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Taxes: CGST (2.5%) + SGST (2.5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-orange-600">₹{grandTotal}</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PRIMARY CTA HIERARCHY (HOLD, SEND KOT, CHARGE)               */}
          {/* ============================================================ */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* CTA 1: Hold Order (Ghost / Slate Outline) */}
              <button
                onClick={handleHoldOrder}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4 text-slate-500" />
                <span>Hold Order</span>
              </button>

              {/* CTA 2: Send KOT (Indigo / Navy with dynamic counter) */}
              <button
                onClick={handleSendKOT}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4 text-indigo-200" />
                <span>Send KOT ({newKOTItemsCount})</span>
              </button>
            </div>

            {/* CTA 3: Primary Settle / Charge Button (Vibrant #EA580C) */}
            <button
              onClick={handleOpenCharge}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white rounded-xl text-sm font-black tracking-wide shadow-lg shadow-orange-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge / Settle Bill (₹{grandTotal})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ITEM VARIANTS & PORTION SIZING (MICRO-SELECTOR)       */}
      {/* ============================================================== */}
      {variantModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                  {variantModalItem.shortcode}
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">{variantModalItem.name}</h3>
                <p className="text-xs text-slate-500">Choose portion size & variants</p>
              </div>
              <button
                onClick={() => setVariantModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Sizing Chips with Calculated Deltas */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Available Sizing</label>
                <div className="space-y-2">
                  {variantModalItem.variants.map((v, vIdx) => {
                    const isSelected = selectedVariant?.name === v.name;
                    const deltaText = v.delta > 0 ? `(+₹${v.delta})` : 'Base';
                    return (
                      <button
                        key={vIdx}
                        onClick={() => setSelectedVariant(v)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50/70 text-orange-950 font-black shadow-xs ring-1 ring-orange-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold">{v.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{deltaText}</span>
                          <span className="text-xs font-black text-slate-900">₹{v.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add-ons if any */}
              {variantModalItem.add_ons && variantModalItem.add_ons.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Add-Ons</label>
                  <div className="space-y-1.5">
                    {variantModalItem.add_ons.map((ao, aoIdx) => {
                      const isChecked = selectedVariantAddOns.some((a) => a.name === ao.name);
                      return (
                        <label
                          key={aoIdx}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVariantAddOns((prev) => [...prev, ao]);
                                } else {
                                  setSelectedVariantAddOns((prev) => prev.filter((a) => a.name !== ao.name));
                                }
                              }}
                              className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                            />
                            <span>{ao.name}</span>
                          </div>
                          <span className="font-bold text-slate-700">+₹{ao.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={handleConfirmVariantAdd}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-600/20 cursor-pointer"
              >
                Add Portion to Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ITEM MODIFIERS & KOT SPECIAL INSTRUCTIONS            */}
      {/* ============================================================== */}
      {modifyingCartIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900">Kitchen Instructions</h3>
                <p className="text-xs text-slate-500">{cart[modifyingCartIndex]?.name}</p>
              </div>
              <button
                onClick={() => setModifyingCartIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Quick Modifier Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Quick Modifiers</label>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_MODIFIERS.map((m, mIdx) => {
                    const isSelected = activeModifiers.some((am) => am.label === m.label);
                    return (
                      <button
                        key={mIdx}
                        onClick={() => toggleModifier(m.label, m.price)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {m.label} {m.price > 0 && `(+₹${m.price})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Freeform Chef Note Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom Chef Note (Prints on KOT Chit)
                </label>
                <textarea
                  rows={2}
                  value={activeChefNote}
                  onChange={(e) => setActiveChefNote(e.target.value)}
                  placeholder="e.g. Pack gravy separately, no coriander garnish..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setModifyingCartIndex(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveItemModifiers}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Apply to Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SPLIT PAYMENT & MULTI-TENDER SETTLEMENT              */}
      {/* ============================================================== */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900">Collect Payment & Settle</h3>
                <p className="text-xs text-slate-500">{orderChannel.toUpperCase()} · {selectedTable || 'Counter'}</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Grand Total Display */}
              <div className="bg-orange-50/50 border border-orange-200/80 p-3.5 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
                  Total Bill Amount Due
                </span>
                <div className="text-3xl font-black text-slate-900 mt-0.5">₹{grandTotal}</div>
              </div>

              {/* Tender Mode Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'split', label: 'Split Tender', icon: Layers }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50 text-orange-900 font-extrabold shadow-2xs ring-1 ring-orange-500'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-orange-600" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode: Cash with Quick Denominations */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cash Tendered
                    </label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full text-lg font-black p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashTendered(String(grandTotal))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Exact (₹{grandTotal})
                    </button>
                    {[500, 1000, 2000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => setCashTendered(String(denom))}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        ₹{denom}
                      </button>
                    ))}
                  </div>

                  {/* Change Return Box */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-emerald-800 font-semibold">Change to Return:</span>
                    <span className="text-base font-black text-emerald-700">₹{changeDue}</span>
                  </div>
                </div>
              )}

              {/* Mode: Split Tender Dual Inputs */}
              {paymentMethod === 'split' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Cash Portion (₹)
                      </label>
                      <input
                        type="number"
                        value={splitCashAmount}
                        onChange={(e) => handleSplitCashChange(e.target.value)}
                        className="w-full text-base font-black p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        UPI / Card Portion (₹)
                      </label>
                      <input
                        type="number"
                        value={splitDigitalAmount}
                        onChange={(e) => setSplitDigitalAmount(e.target.value)}
                        className="w-full text-base font-black p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-100 rounded-xl flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Balance Unallocated:</span>
                    <span className={splitRemaining === 0 ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                      ₹{splitRemaining}
                    </span>
                  </div>
                </div>
              )}

              {/* Mode: UPI Dynamic QR */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-xs">
                    <QrCode className="w-24 h-24 text-slate-900" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Scan & Pay ₹{grandTotal}</p>
                  <p className="text-[11px] text-slate-400">Works with Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
              )}

              {/* Mode: Card Terminal */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Insert / Tap Card on EDC Terminal</p>
                  <p className="text-[11px] text-slate-400">Awaiting POS Swipe Approval</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={handleCompleteSettlement}
                disabled={paymentMethod === 'split' && splitRemaining !== 0}
                className={`w-full py-3 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
                  paymentMethod === 'split' && splitRemaining !== 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                Complete Settlement & Print Tax Receipt (₹{grandTotal})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: TABLE OPERATIONS (TRANSFER / MERGE)                   */}
      {/* ============================================================== */}
      {tableOpsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {tableOpsType === 'transfer' ? 'Transfer Table' : 'Merge Tables'}
                </h3>
                <p className="text-xs text-slate-500">Currently on {selectedTable}</p>
              </div>
              <button
                onClick={() => setTableOpsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Select Destination Table
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tablesList
                  .filter((t) => t.table_number !== selectedTable)
                  .map((t) => (
                    <button
                      key={t.id || t.table_number}
                      type="button"
                      onClick={() => setTargetTableId(t.table_number)}
                      className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        targetTableId === t.table_number
                          ? 'border-orange-600 bg-orange-50 text-orange-950 ring-1 ring-orange-500 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.table_number}
                    </button>
                  ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setTableOpsModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTableOps}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Confirm {tableOpsType === 'transfer' ? 'Transfer' : 'Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: QUICK DISCOUNT                                       */}
      {/* ============================================================== */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title="Apply Discount"
        footer={
          <button
            onClick={() => {
              setDiscountPercent(tempDiscount);
              setDiscountModalOpen(false);
              showToast(`Applied ${tempDiscount}% discount`, 'success');
            }}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Apply Discount
          </button>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setTempDiscount(pct)}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  tempDiscount === pct
                    ? 'border-orange-600 bg-orange-50 text-orange-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            max="100"
            value={tempDiscount}
            onChange={(e) => setTempDiscount(Number(e.target.value))}
            placeholder="Custom %"
            className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-bold"
          />
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6: QUICK CUSTOMER ATTACH                                */}
      {/* ============================================================== */}
      <Modal
        isOpen={newCustomerModal}
        onClose={() => setNewCustomerModal(false)}
        title="Attach Customer to Ticket"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Guest Full Name</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Vikramaditya Singhania"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="+91 98250 12345"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Attach Customer
          </button>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* 80mm THERMAL SLIP PRINT MODAL (KOT & CUSTOMER TAX INVOICE)    */}
      {/* ============================================================== */}
      {thermalReceiptOrder && (
        <ThermalReceiptModal
          order={thermalReceiptOrder}
          initialType={thermalPrintStation === 'BILL' ? 'bill' : 'kot'}
          onClose={() => setThermalReceiptOrder(null)}
        />
      )}

      {/* Manager PIN Authorization Modal */}
      {pinModalConfig && (
        <ManagerPinModal
          actionTitle={pinModalConfig.actionTitle}
          actionDescription={pinModalConfig.actionDescription}
          onSuccess={pinModalConfig.onSuccess}
          onCancel={() => setPinModalConfig(null)}
        />
      )}
    </div>
  );
}
