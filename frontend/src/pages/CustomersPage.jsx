import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  IndianRupee,
  Heart,
  FileText,
  ArrowLeft,
  ChevronRight,
  Save,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportCustomers } from '../utils/exportCSV';
import Drawer from '../components/common/Drawer';
import Modal from '../components/common/Modal';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [addModal, setAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [favoriteItems, setFavoriteItems] = useState('');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchCustomers = useCallback(async (search = '', signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setCustomers([]);
    try {
      const res = await api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`, { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading customers', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId, showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(searchQuery, controller.signal);
    return () => controller.abort();
  }, [searchQuery, fetchCustomers]);

  const handleOpenProfile = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await api.get(`/customers/${customer.id}`);
      setCustomerDetails(res.data);
    } catch (e) {
      setCustomerDetails(customer);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        name,
        phone,
        email,
        address,
        favorite_items: favoriteItems,
        notes
      });
      showToast(`Guest profile created for ${name}`, 'success');
      setAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setFavoriteItems('');
      setNotes('');
      fetchCustomers();
    } catch (err) {
      showToast('Error adding customer', 'error');
    }
  };

  // Keyboard shortcut Ctrl+S to save new customer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        if (addModal) {
          e.preventDefault();
          handleCreateCustomer(e);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addModal, name, phone, email, address, favoriteItems, notes]);

  // FULL DESK VIEW FOR NEW CUSTOMER (Matching NewPurchaseOrderPage layout)
  if (addModal) {
    return (
      <div className="min-h-screen bg-[#f4f5f6] text-slate-800 pb-16 font-sans text-xs">
        {/* Top Desk Header */}
        <div className="sticky top-12 z-30 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAddModal(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Customers</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">New Customer Profile</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Not Saved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddModal(false)}
                className="btn-tactile px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium shadow-2xs text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                className="btn-tactile flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium shadow-2xs hover:shadow-xs transition-all text-xs cursor-pointer"
                title="Save Customer (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Customer</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded font-mono">Ctrl+S</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Desk Body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Guest Contact Information</h2>
                <p className="text-slate-500 text-[11px]">Primary contact coordinates for customer orders & reservations</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Section 1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@mail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Delivery / Residence Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Shivalik Residency, Bopal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Preferences & Dietary Notes</h2>
                <p className="text-slate-500 text-[11px]">Special dish favorites, allergy notes & seating preferences</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Section 2</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Favorite Menu Items</label>
                <input
                  type="text"
                  value={favoriteItems}
                  onChange={(e) => setFavoriteItems(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala, Cold Coffee, Garlic Naan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Dietary Notes / Allergies / Table Preferences</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefers quiet corner or window booth. Mild spice level. Jain preparation requested."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Guest Relationship CRM</h1>
          <p className="text-xs text-slate-500 mt-1">Dining histories, lifetime value, favorite dishes & dietary preferences</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white w-60"
            />
          </div>
          <button
            onClick={() => {
              exportCustomers(filteredCustomers);
              showToast(`Exported ${filteredCustomers.length} customers to CSV`, 'success');
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <SkeletonModulePage type="table" rows={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Guest Name</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Total Orders</th>
                  <th className="py-3.5 px-4">Lifetime Spend</th>
                  <th className="py-3.5 px-4">Last Dining Visit</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => handleOpenProfile(cust)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                          {cust.name.charAt(0)}
                        </div>
                        <span>{cust.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 font-mono">
                      {cust.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold">
                      {cust.total_orders} orders
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-orange-600">
                      ₹{Number(cust.total_spent).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {cust.last_visit ? new Date(cust.last_visit).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Profile Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Guest Profile"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            {/* Top avatar & lifetime value */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {selectedCustomer.name.charAt(0)}
              </div>
              <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
              <p className="text-slate-500">{selectedCustomer.phone}</p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Orders</span>
                  <div className="text-base font-extrabold text-slate-900">{selectedCustomer.total_orders}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Spend</span>
                  <div className="text-base font-extrabold text-orange-600">₹{selectedCustomer.total_spent}</div>
                </div>
              </div>
            </div>

            {/* Favorite Items */}
            {selectedCustomer.favorite_items && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] uppercase">
                  <Heart className="w-3.5 h-3.5 text-amber-600 fill-current" /> Favorite Dishes
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedCustomer.favorite_items}
                </p>
              </div>
            )}

            {/* Dietary & Staff Notes */}
            {selectedCustomer.notes && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1 text-[11px] uppercase">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Dietary & Preference Notes
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedCustomer.notes}
                </p>
              </div>
            )}

            {/* Recent Orders History */}
            {customerDetails?.orderHistory && customerDetails.orderHistory.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Past Dining Visits</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {customerDetails.orderHistory.map((ord) => (
                    <div key={ord.id} className="p-3 flex justify-between items-center bg-white">
                      <div>
                        <span className="font-bold text-slate-900">{ord.order_number}</span>
                        <span className="text-slate-400 text-[10px] block">
                          {new Date(ord.created_at).toLocaleDateString()} • {ord.table_name || ord.order_type}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900">₹{ord.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
