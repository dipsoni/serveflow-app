import React, { useState, useEffect } from 'react';
import {
  Users2,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminLeadsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [leads, setLeads] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState(null);

  // Convert modal
  const [convertModalLead, setConvertModalLead] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('plan-starter');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [initialPassword, setInitialPassword] = useState('welcome@123');
  const [converting, setConverting] = useState(false);

  // Conversion result celebratory modal
  const [conversionSuccess, setConversionSuccess] = useState(null);

  // Fetch leads and plans
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/leads', {
        params: { search: search || undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined }
      });
      setLeads(res.data.leads || []);
    } catch (err) {
      console.error('Failed to load leads', err);
      showToast('Could not load sales leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      console.warn('Could not load plans', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchPlans();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const res = await api.put(`/super-admin/leads/${leadId}`, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? res.data.lead : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(res.data.lead);
      }
      showToast(`Lead status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleSaveNotes = async (leadId, notes, followUpDate, assignedTo) => {
    try {
      const res = await api.put(`/super-admin/leads/${leadId}`, {
        notes,
        follow_up_date: followUpDate,
        assigned_to: assignedTo
      });
      setLeads(prev => prev.map(l => l.id === leadId ? res.data.lead : l));
      setSelectedLead(res.data.lead);
      showToast('Lead details saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save lead details', 'error');
    }
  };

  const handleConvertLead = async () => {
    if (!convertModalLead) return;
    setConverting(true);
    try {
      const res = await api.post(`/super-admin/leads/${convertModalLead.id}/convert`, {
        planId: selectedPlanId,
        billingCycle,
        password: initialPassword
      });

      setConvertModalLead(null);
      setConversionSuccess(res.data);
      fetchLeads();
      showToast('Lead successfully converted to restaurant tenant!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to convert lead', 'error');
    } finally {
      setConverting(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const map = {
      new: { label: 'New Inquiry', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      contacted: { label: 'Contacted', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      demo_scheduled: { label: 'Demo Scheduled', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      demo_completed: { label: 'Demo Done', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
      proposal_sent: { label: 'Proposal Sent', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      negotiation: { label: 'Negotiation', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      converted: { label: 'Converted to Tenant', bg: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 font-bold' },
      lost: { label: 'Closed / Lost', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      follow_up_required: { label: 'Follow-Up Needed', bg: 'bg-amber-600/20 text-amber-300 border-amber-600/30' }
    };
    const s = map[status] || { label: status, bg: 'bg-slate-700/50 text-slate-300 border-slate-600' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  // Metrics calculation
  const totalCount = leads.length;
  const newCount = leads.filter(l => l.status === 'new').length;
  const demoCount = leads.filter(l => l.status === 'demo_scheduled' || l.status === 'demo_completed').length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;
  const negotiationCount = leads.filter(l => l.status === 'negotiation' || l.status === 'proposal_sent').length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              SALES FUNNEL
            </span>
            <span className="text-xs text-slate-400">Petpooja-Style Assisted Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Demo Requests & Sales Leads
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture prospective restaurant inquiries, schedule demos, send proposals, and convert into active SaaS tenants.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Pipeline
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Total Leads</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-emerald-400">New Inquiries</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{newCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-purple-400">Demos Scheduled</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{demoCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-amber-400">Proposal / Neg.</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{negotiationCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-medium text-indigo-400">Converted Tenants</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{convertedCount}</div>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant, owner, city, or phone..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </form>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { key: 'ALL', label: 'All Statuses' },
            { key: 'new', label: 'New' },
            { key: 'demo_scheduled', label: 'Demo' },
            { key: 'proposal_sent', label: 'Proposal' },
            { key: 'negotiation', label: 'Negotiation' },
            { key: 'converted', label: 'Converted' },
            { key: 'lost', label: 'Lost' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Leads Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Restaurant / Concept</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Outlets & Scale</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Assigned / Follow-Up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading leads pipeline...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Users2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No sales leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Restaurant & City */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{lead.restaurant_name}</div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{lead.city || 'Not specified'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-purple-400 font-medium">{lead.restaurant_type}</span>
                      </div>
                    </td>

                    {/* Owner Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{lead.owner_name}</div>
                      <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {lead.mobile}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{lead.email}</div>
                    </td>

                    {/* Outlets & Scale */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.number_of_branches || 1} Outlets</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ~{lead.daily_orders || '100'} orders/day
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Using: {lead.current_software || 'None'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        {getStatusBadge(lead.status)}
                        {lead.status !== 'converted' && (
                          <div>
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                            >
                              <option value="new">Mark: New</option>
                              <option value="contacted">Mark: Contacted</option>
                              <option value="demo_scheduled">Mark: Demo Scheduled</option>
                              <option value="demo_completed">Mark: Demo Completed</option>
                              <option value="proposal_sent">Mark: Proposal Sent</option>
                              <option value="negotiation">Mark: In Negotiation</option>
                              <option value="follow_up_required">Mark: Follow-Up Required</option>
                              <option value="lost">Mark: Closed / Lost</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Assigned & Follow-Up */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">{lead.assigned_to || 'Sales Rep'}</div>
                      {lead.follow_up_date && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {lead.follow_up_date}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          View Details
                        </button>

                        {lead.status === 'converted' ? (
                          <button
                            onClick={() => navigate('/super-admin/restaurants')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Tenant Active
                          </button>
                        ) : (
                          <button
                            onClick={() => setConvertModalLead(lead)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                    LEAD PROFILE #{selectedLead.id}
                  </span>
                  {getStatusBadge(selectedLead.status)}
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{selectedLead.restaurant_name}</h2>
                <p className="text-xs text-slate-400">
                  {selectedLead.city} • {selectedLead.restaurant_type} • {selectedLead.number_of_branches} Branches
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Owner / Decision Maker</span>
                <span className="font-semibold text-white text-sm">{selectedLead.owner_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Mobile</span>
                <span className="font-semibold text-purple-400">{selectedLead.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Official Email</span>
                <span className="font-semibold text-slate-300">{selectedLead.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Daily Order Volume</span>
                <span className="font-semibold text-slate-300">{selectedLead.daily_orders} orders / day</span>
              </div>
            </div>

            {/* Requirements & Notes */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Key Hospitality Requirements</label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedLead.requirements || 'No specific requirements tagged.'}
                </div>
              </div>

              {selectedLead.message && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Customer Inbound Message</label>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 italic">
                    "{selectedLead.message}"
                  </div>
                </div>
              )}

              {/* Editable Follow-Up, Assignee and Notes */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">Internal Sales Follow-Up</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Assigned Sales Executive</label>
                    <input
                      type="text"
                      defaultValue={selectedLead.assigned_to || ''}
                      id="lead-assigned-to"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                      placeholder="e.g. Pooja Mehta"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Next Follow-Up Date</label>
                    <input
                      type="date"
                      defaultValue={selectedLead.follow_up_date || ''}
                      id="lead-followup-date"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Internal Call Notes & Discussions</label>
                  <textarea
                    rows={3}
                    defaultValue={selectedLead.notes || ''}
                    id="lead-notes"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    placeholder="Enter discussion notes from demo call..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const notes = document.getElementById('lead-notes').value;
                      const date = document.getElementById('lead-followup-date').value;
                      const assigned = document.getElementById('lead-assigned-to').value;
                      handleSaveNotes(selectedLead.id, notes, date, assigned);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs"
                  >
                    Save Notes & Follow-Up
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Created: {new Date(selectedLead.created_at).toLocaleString()}
              </div>

              {selectedLead.status !== 'converted' ? (
                <button
                  onClick={() => {
                    const lead = selectedLead;
                    setSelectedLead(null);
                    setConvertModalLead(lead);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  Convert Lead to Restaurant Account
                </button>
              ) : (
                <button
                  onClick={() => navigate('/super-admin/restaurants')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  View Restaurant Tenant in Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Convert Lead into Restaurant Tenant Modal */}
      {convertModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                  PETPOOJA ASSISTED ONBOARDING
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Convert Lead to Restaurant Tenant
                </h3>
              </div>
              <button
                onClick={() => setConvertModalLead(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Converting <strong className="text-white">{convertModalLead.restaurant_name}</strong> will provision a secure isolated database tenant, create default branch <span className="text-purple-400 font-medium">{convertModalLead.city}</span>, initialize owner credentials, and launch the 12-step onboarding wizard.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Select SaaS Subscription Plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(plans.length > 0 ? plans : [
                    { id: 'plan-starter', name: 'Starter Growth', price: 2499, max_branches: 2 },
                    { id: 'plan-pro', name: 'Pro Multi-Branch', price: 4999, max_branches: 5 }
                  ]).map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPlanId === p.id
                          ? 'border-purple-500 bg-purple-500/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-white">{p.name}</div>
                      <div className="text-purple-400 font-semibold mt-0.5">₹{p.price} / month</div>
                      <div className="text-[10px] text-slate-500 mt-1">Up to {p.max_branches} branches</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="monthly">Monthly Recurring</option>
                    <option value="quarterly">Quarterly (3 Months)</option>
                    <option value="yearly">Annual (12 Months - 15% Off)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Initial Owner Password</label>
                  <input
                    type="text"
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={converting}
                onClick={handleConvertLead}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {converting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Provisioning Tenant...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Launch Tenant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Celebratory Conversion Success Modal */}
      {conversionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 space-y-5 text-center shadow-2xl shadow-emerald-500/10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Restaurant Tenant Created!</h3>
              <p className="text-xs text-slate-300 mt-1">
                The lead was successfully converted. Credentials and business tenant records are live.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Business ID:</span>
                <span className="text-emerald-400 font-bold">{conversionSuccess.restaurant?.businessId || 'REST-10005'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner Login:</span>
                <span className="text-white">{conversionSuccess.lead?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Temporary Password:</span>
                <span className="text-amber-400">{conversionSuccess.temporaryPassword}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConversionSuccess(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setConversionSuccess(null);
                  navigate('/super-admin/restaurants');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
              >
                <span>View in Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
