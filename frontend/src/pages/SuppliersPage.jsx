import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  FileText,
  Download
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportSuppliers } from '../utils/exportCSV';
import Modal from '../components/common/Modal';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModal, setAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [productsSupplied, setProductsSupplied] = useState('');
  const [outstanding, setOutstanding] = useState('0');

  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const fetchSuppliers = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    setLoading(true);
    setSuppliers([]);
    try {
      const res = await api.get('/suppliers', { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setSuppliers(res.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) showToast('Error loading suppliers', 'error');
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSuppliers(controller.signal);
    return () => controller.abort();
  }, [fetchSuppliers]);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', {
        name,
        phone,
        email,
        address,
        gst_number: gstNumber,
        products_supplied: productsSupplied,
        outstanding_amount: Number(outstanding) || 0
      });
      showToast(`Supplier ${name} saved`, 'success');
      setAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstNumber('');
      setProductsSupplied('');
      fetchSuppliers();
    } catch (err) {
      showToast('Error saving supplier', 'error');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.products_supplied?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers & Vendors</h1>
          <p className="text-xs text-slate-500 mt-1">Wholesale vendor contacts, GST credentials & outstanding payment balances</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor or product..."
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white w-56"
            />
          </div>
          <button
            onClick={() => {
              exportSuppliers(filteredSuppliers);
              showToast(`Exported ${filteredSuppliers.length} suppliers to CSV`, 'success');
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
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonModulePage type="table" rows={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{sup.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">GST: {sup.gst_number || 'N/A'}</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sup.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                  <span className="font-semibold text-slate-500 block">Supplied Products:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{sup.products_supplied || 'General Provisions'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Outstanding:</span>
                <span className={`font-extrabold text-sm ${
                  Number(sup.outstanding_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  ₹{Number(sup.outstanding_amount).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Register New Wholesale Supplier"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Dairy Farms"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99880 11223"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@mail.com"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="29AAAAF1234A1Z1"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Opening Outstanding (₹)</label>
              <input
                type="number"
                value={outstanding}
                onChange={(e) => setOutstanding(e.target.value)}
                placeholder="0"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Products Supplied</label>
            <input
              type="text"
              value={productsSupplied}
              onChange={(e) => setProductsSupplied(e.target.value)}
              placeholder="e.g. Malai Paneer, Milk, Cream, Butter"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Warehouse Address</label>
            <textarea
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Plot / Street / APMC Yard..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
          >
            Save Supplier Profile
          </button>
        </form>
      </Modal>
    </div>
  );
}
