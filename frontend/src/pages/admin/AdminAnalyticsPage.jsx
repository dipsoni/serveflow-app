import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalyticsPage() {
  const data = [
    { name: 'Jan', newRestaurants: 4 },
    { name: 'Feb', newRestaurants: 7 },
    { name: 'Mar', newRestaurants: 5 },
    { name: 'Apr', newRestaurants: 12 },
    { name: 'May', newRestaurants: 8 },
    { name: 'Jun', newRestaurants: 15 }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Platform Analytics</h1>
      <p className="text-slate-400 text-xs">Cross-company platform usage and growth statistics.</p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">New Restaurant Registrations (Monthly)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                cursor={{ fill: '#334155', opacity: 0.4 }}
              />
              <Bar dataKey="newRestaurants" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
