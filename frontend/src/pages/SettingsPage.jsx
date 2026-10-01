import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Percent,
  Receipt,
  Printer,
  Save,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { setRestaurant } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile'); // profile, tax, invoice, printer

  // Form states
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [currency, setCurrency] = useState('₹');

  const [taxRate, setTaxRate] = useState('5.0');
  const [serviceCharge, setServiceCharge] = useState('0.0');

  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [footerText, setFooterText] = useState('');

  const [kotPrinter, setKotPrinter] = useState('');
  const [billPrinter, setBillPrinter] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/settings');
        const r = res.data;
        if (r) {
          setName(r.name || '');
          setTagline(r.tagline || '');
          setAddress(r.address || '');
          setPhone(r.phone || '');
          setEmail(r.email || '');
          setGstNumber(r.gst_number || '');
          setCurrency(r.currency || '₹');
          setTaxRate(String(r.tax_rate || 5.0));
          setServiceCharge(String(r.service_charge || 0.0));
          setInvoicePrefix(r.invoice_prefix || 'INV-');
          setFooterText(r.footer_text || '');
          setKotPrinter(r.kot_printer || '');
          setBillPrinter(r.bill_printer || '');
        }
      } catch (err) {
        showToast('Error loading restaurant settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        tagline,
        address,
        phone,
        email,
        gst_number: gstNumber,
        currency,
        tax_rate: Number(taxRate),
        service_charge: Number(serviceCharge),
        invoice_prefix: invoicePrefix,
        footer_text: footerText,
        kot_printer: kotPrinter,
        bill_printer: billPrinter
      };

      const res = await api.put('/settings', payload);
      setRestaurant(res.data.restaurant);
      showToast('Restaurant configurations saved successfully', 'success');
    } catch (err) {
      showToast('Error saving settings', 'error');
    }
  };

  const sections = [
    { id: 'profile', label: 'Restaurant Profile', icon: Building },
    { id: 'tax', label: 'Tax & GST Settings', icon: Percent },
    { id: 'invoice', label: 'Invoice & Receipts', icon: Receipt },
    { id: 'printer', label: 'Thermal Printers', icon: Printer }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">Manage restaurant identity, GSTIN, thermal printer IPs & receipt templates</p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 h-fit">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-orange-50 text-orange-700 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configuration Form Card */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* SECTION 1: PROFILE */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Restaurant Identity</h3>
                  <p className="text-slate-500">Legal branding displayed on receipts, KOTs, and QR digital menus</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Restaurant Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Address</label>
                  <textarea
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* SECTION 2: TAX */}
            {activeSection === 'tax' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tax & Surcharge Rates</h3>
                  <p className="text-slate-500">Government GST and restaurant service charges added at POS checkout</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Restaurant GST Rate (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Standard restaurant composite GST is 5.0%</span>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Discretionary Service Charge (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: INVOICE */}
            {activeSection === 'invoice' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Invoice Prefix & Receipt Notes</h3>
                  <p className="text-slate-500">Customize receipt headers, unique sequential invoice numbering & customer greetings</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Output: INV-2026-1024</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Receipt Footer Note</label>
                  <textarea
                    rows="3"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Printed at the bottom of customer receipts</span>
                </div>
              </div>
            )}

            {/* SECTION 4: PRINTER */}
            {activeSection === 'printer' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thermal Printer Devices</h3>
                  <p className="text-slate-500">ESC/POS LAN Network or USB connected thermal printers</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kitchen KOT Thermal Printer</label>
                    <input
                      type="text"
                      value={kotPrinter}
                      onChange={(e) => setKotPrinter(e.target.value)}
                      placeholder="e.g. 192.168.1.101:9100"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Billing Counter Thermal Printer</label>
                    <input
                      type="text"
                      value={billPrinter}
                      onChange={(e) => setBillPrinter(e.target.value)}
                      placeholder="e.g. USB/COM1 (80mm Thermal)"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
