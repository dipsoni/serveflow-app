import React, { useState, useEffect } from 'react';
import { Search, Utensils, ShoppingBag, Users, Layers, Truck, UserCheck, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ menu: [], orders: [], customers: [], inventory: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ menu: [], orders: [], customers: [], inventory: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [menuRes, ordersRes, custRes, invRes] = await Promise.all([
          api.get('/menu/items'),
          api.get('/orders'),
          api.get(`/customers?search=${encodeURIComponent(query)}`),
          api.get('/inventory')
        ]);

        const q = query.toLowerCase();
        setResults({
          menu: (menuRes.data || []).filter(i => i.name.toLowerCase().includes(q)).slice(0, 4),
          orders: (ordersRes.data || []).filter(o => o.order_number?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q)).slice(0, 3),
          customers: (custRes.data || []).slice(0, 3),
          inventory: (invRes.data || []).filter(i => i.name.toLowerCase().includes(q)).slice(0, 3)
        });
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  const totalResults = results.menu.length + results.orders.length + results.customers.length + results.inventory.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, orders (#ORD-), customers, inventory..."
              className="flex-1 bg-transparent text-slate-900 text-sm focus:outline-hidden placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="ml-2 px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 rounded border border-slate-200">
              ESC
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="py-6 text-center text-sm text-slate-400">
                Searching across restaurant records...
              </div>
            )}

            {!loading && query && totalResults === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No records found matching "{query}".
              </div>
            )}

            {!query && (
              <div className="py-6 text-center text-xs text-slate-400">
                Type something to search menu items, orders, guests, or raw stock.
              </div>
            )}

            {/* Menu Items */}
            {results.menu.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" /> Menu Dishes
                </h4>
                <div className="space-y-1">
                  {results.menu.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect('/menu')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 hover:text-orange-950 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-sm font-medium text-slate-800 group-hover:text-orange-900">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders */}
            {results.orders.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Orders
                </h4>
                <div className="space-y-1">
                  {results.orders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => handleSelect('/orders')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{o.order_number}</span>
                        <span className="text-xs text-slate-500 ml-2">({o.customer_name} • {o.table_name || o.order_type})</span>
                      </div>
                      <span className="text-xs font-bold text-orange-600">₹{o.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Customers
                </h4>
                <div className="space-y-1">
                  {results.customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect('/customers')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-900">{c.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{c.phone}</span>
                      </div>
                      <span className="text-xs text-slate-500">{c.total_orders} orders</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory */}
            {results.inventory.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Inventory Items
                </h4>
                <div className="space-y-1">
                  {results.inventory.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => handleSelect('/inventory')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-900">{inv.name}</span>
                      <span className="text-xs font-semibold text-slate-600">{inv.current_stock} {inv.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Navigation: Click to jump directly to record</span>
            <span>Shortcut: <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded">Ctrl+K</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
}
