import React, { useState, useEffect } from 'react';
import { Search, Building2, Store } from 'lucide-react';
import api from '../../services/api';

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/super-admin/branches');
        setBranches(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Branches Overview</h1>
      <p className="text-slate-400 text-xs">View all operational branches across all tenants.</p>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Branch Name</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">City</th>
                <th className="px-6 py-3 font-semibold">Manager</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {branches.map(b => (
                <tr key={b.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-semibold text-white">{b.name}</td>
                  <td className="px-6 py-4">{b.company}</td>
                  <td className="px-6 py-4">{b.city}</td>
                  <td className="px-6 py-4">{b.manager}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
