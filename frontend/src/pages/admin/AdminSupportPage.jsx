import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Building2,
  User,
  X,
  Send,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminSupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/support', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined
        }
      });
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
  }, [statusFilter, priorityFilter]);

  const handleUpdateTicket = async (ticketId, status, responseText) => {
    setResolving(true);
    try {
      const res = await api.put(`/super-admin/support/${ticketId}`, {
        status,
        admin_response: responseText
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? res.data.ticket : t));
      setSelectedTicket(res.data.ticket);
      showToast(`Ticket #${ticketId} status updated to ${status}`, 'success');
    } catch (err) {
      showToast('Failed to update ticket', 'error');
    } finally {
      setResolving(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-700">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">In Progress</span>;
      case 'waiting_customer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Waiting on Client</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">Resolved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              HELPDESK & SUPPORT
            </span>
            <span className="text-xs text-slate-400">Multi-Tenant Customer Service</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Support & Incident Tickets
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Resolve technical, hardware, printer, and billing issues submitted by restaurant owners and managers.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Tickets
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'open', 'in_progress', 'resolved', 'closed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Ticket / Subject</th>
                <th className="py-3 px-4">Restaurant Tenant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
                    All support tickets resolved! No pending issues.
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{ticket.subject}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">#{ticket.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{ticket.company_name}</div>
                      <div className="text-[11px] text-slate-500">By: {ticket.user_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {ticket.category}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setAdminResponse(ticket.admin_response || '');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-purple-400 hover:bg-slate-700 transition-colors"
                      >
                        Respond & Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-purple-400">#{selectedTicket.id}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400">
                  {selectedTicket.company_name} • Reported by {selectedTicket.user_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="text-slate-500 font-semibold block mb-1">Issue Description:</span>
              {selectedTicket.description}
            </div>

            {/* Admin Response Box */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-white block">Platform Support Resolution / Reply:</label>
              <textarea
                rows={4}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Type resolution notes or reply message to the restaurant owner..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateTicket(selectedTicket.id, 'in_progress', adminResponse)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTicket(selectedTicket.id, 'closed', adminResponse)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-white"
                >
                  Close Ticket
                </button>
              </div>

              <button
                type="button"
                disabled={resolving}
                onClick={() => handleUpdateTicket(selectedTicket.id, 'resolved', adminResponse)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
