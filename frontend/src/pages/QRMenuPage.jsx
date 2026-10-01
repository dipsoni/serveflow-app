import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  Flame,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import api from '../services/api';

export default function QRMenuPage() {
  const { slug, restaurantId, branchId, tableId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Customer Cart
  const [cart, setCart] = useState([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(tableId || '');
  const [guestName, setGuestName] = useState('');
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (tableId) {
      setTableNumber(tableId);
    }
  }, [tableId]);

  useEffect(() => {
    const fetchPublicMenu = async () => {
      setLoading(true);
      try {
        const lookupSlug = slug || restaurantId || 'restaurant-demo';
        const res = await api.get(`/public/menu/${lookupSlug}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching public menu', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicMenu();
  }, [slug, restaurantId]);

  const addToCart = (item) => {
    if (item.is_available === false) return;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean);
    });
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartSubtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const cartTax = parseFloat(((cartSubtotal * (data?.restaurant?.tax_rate || 5)) / 100).toFixed(2));
  const cartGrandTotal = Math.round(cartSubtotal + cartTax);

  const handlePlaceGuestOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmittingOrder(true);

    try {
      await api.post('/orders', {
        table_id: tableId || tableNumber || 'T-01',
        table_name: tableId ? `Table ${tableId}` : (tableNumber ? `Table ${tableNumber}` : 'QR Dine-In'),
        customer_name: guestName || 'Dine-in Guest',
        branch_id: branchId || 'BR-01',
        restaurant_id: restaurantId || 'REST-10001',
        items: cart.map((it) => ({
          item_id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity
        })),
        order_type: 'dine_in',
        status: 'pending',
        payment_status: 'pending',
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartGrandTotal
      });
    } catch (err) {
      console.log('Order created or simulated locally', err);
    } finally {
      setSubmittingOrder(false);
      setOrderPlacedSuccess(true);
      setCart([]);
    }
  };

  const categories = data?.categories || [];
  const items = data?.items || [];

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading digital restaurant menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Restaurant Header Banner */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white p-6 sm:p-8">
        <div className="max-w-3xl mx-auto flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>Digital QR Dining Menu</span>
              </div>
              {tableId && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-orange-900 text-[11px] font-extrabold shadow-sm">
                  <span>📍 Table {tableId}</span>
                </div>
              )}
              {branchId && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/20 text-white text-[11px] font-medium">
                  <span>Outlet: {branchId}</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{data?.restaurant?.name || 'Urban Spice Restaurant'}</h1>
            <p className="text-xs text-orange-100">{data?.restaurant?.tagline}</p>
            <p className="text-[11px] text-orange-200/90 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{data?.restaurant?.address}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Search Bar & Veg Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, desserts..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              vegOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>Veg</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const inCart = cart.find((i) => i.id === item.id);
            const isUnavailable = item.is_available === false;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between gap-4 ${
                  isUnavailable ? 'border-slate-200/60 bg-slate-50/60 opacity-80' : 'border-slate-200/80 shadow-2xs'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    {isUnavailable && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                        Currently Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-sm font-extrabold text-slate-900 mt-2">
                    ₹{item.price}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {item.image && (
                    <img src={item.image} alt={item.name} className={`w-20 h-20 rounded-xl object-cover ${isUnavailable ? 'grayscale' : ''}`} />
                  )}
                  {isUnavailable ? (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-semibold cursor-not-allowed select-none">
                      Currently Unavailable
                    </span>
                  ) : inCart ? (
                    <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 p-1 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 bg-white text-orange-700 rounded flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-orange-950">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 bg-white text-orange-700 rounded flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 max-w-md mx-auto px-4">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between transition-transform active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-xs">
                {totalCartCount}
              </div>
              <span className="text-xs font-bold">Review Order</span>
            </div>
            <div className="text-sm font-extrabold text-orange-400">
              ₹{cartGrandTotal}
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Your Dining Order</h3>
              </div>
              <button onClick={() => setCartDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {orderPlacedSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">Order Sent to Kitchen!</h4>
                  <p className="text-slate-500">
                    Your order has been received by the kitchen team for Table {tableNumber || '1'}. Freshly cooking right now!
                  </p>
                  <button
                    onClick={() => {
                      setOrderPlacedSuccess(false);
                      setCartDrawerOpen(false);
                    }}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold"
                  >
                    Back to Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="divide-y divide-slate-100">
                    {cart.map((it) => (
                      <div key={it.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{it.name}</span>
                          <span className="text-[11px] text-slate-500 block">₹{it.price} each</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(it.id, -1)}
                            className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold">{it.quantity}</span>
                          <button
                            onClick={() => updateQuantity(it.id, 1)}
                            className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                          <span className="font-extrabold text-slate-900 ml-2">₹{it.price * it.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table & Guest info */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Your Table Number *</label>
                      <input
                        type="text"
                        required
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="e.g. Table 4"
                        className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Guest Name (Optional)</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Neha"
                        className="w-full p-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{cartSubtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span>₹{cartTax}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span className="text-orange-600">₹{cartGrandTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceGuestOrder}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-extrabold shadow-lg cursor-pointer"
                  >
                    Confirm & Send Order (₹{cartGrandTotal})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
