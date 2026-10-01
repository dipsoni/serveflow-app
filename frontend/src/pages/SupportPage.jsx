import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Building2,
  FileQuestion,
  X,
  Send,
  LifeBuoy
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SupportPage() {
  const { user, restaurant } = useAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('POS Issue');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/restaurant/support');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
      showToast('Could not load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      showToast('Subject and description are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/restaurant/support', {
        subject,
        category,
        priority,
        description
      });
      setTickets(prev => [res.data.ticket, ...prev]);
      setCreateModalOpen(false);
      setSubject('');
      setDescription('');
      showToast('Support ticket submitted successfully! Our support engineering team has been notified.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit support ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Low</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">In Progress</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">Resolved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Closed</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">
              HELPDESK & DESK SUPPORT
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Help & Technical Support
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit inquiries, report POS or thermal printer hardware issues, and receive rapid assistance from ServeFlow engineers.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Support Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">24/7 Enterprise SLA</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Critical POS down issues receive prioritized response within 15 minutes.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Hardware & Printers</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Assistance for USB, Bluetooth, and LAN 80mm thermal receipt printers.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Multi-Outlet Rollout</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Assisted configuration for base kitchen commissary and multi-branch menu sync.
            </p>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Your Support Tickets</h3>
          <span className="text-xs font-semibold text-slate-500">{tickets.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-6">Ticket / Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Logged</th>
                <th className="py-3 px-6">Resolution / Reply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <FileQuestion className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No open support tickets. Everything is running smoothly!
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-800 text-sm">{t.subject}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">#{t.id}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-sm">{t.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {t.category}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(t.priority)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6">
                      {t.admin_response ? (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 max-w-md">
                          <span className="font-bold text-emerald-800 block text-[11px]">Platform Engineering:</span>
                          {t.admin_response}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Waiting for agent review...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  ASSISTED HELPDESK
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Raise Support Ticket</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject / Issue Summary *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Printer not printing KOT tickets after Windows update"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="POS Issue">POS Terminal / Billing</option>
                    <option value="Hardware / Printer">Hardware & Printers</option>
                    <option value="Billing">SaaS Subscription & Billing</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Onboarding">Onboarding / Multi-Branch</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Low">Low (General Query)</option>
                    <option value="Medium">Medium (Normal Operation)</option>
                    <option value="High">High (Impacting Customer Service)</option>
                    <option value="Urgent">Urgent (POS Offline / Outage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail, error codes, and steps to reproduce..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-orange-600 hover:bg-orange-500 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
