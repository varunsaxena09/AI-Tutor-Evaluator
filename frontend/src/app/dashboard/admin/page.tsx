"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, Search, Filter, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!token || user.role !== 'ADMIN') return router.push('/login');
      
      try {
        const res = await fetch('http://localhost:5000/api/dashboard/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        } else {
           if(res.status === 401 || res.status === 403) router.push('/login');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col transition-colors">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
             <BarChart2 className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Manage and analyze candidates</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 bg-card border border-border rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-foreground transition-all flex items-center gap-2">
           <LogOut className="w-5 h-5"/> Logout
        </button>
      </header>

      <div className="flex gap-4 mb-8">
         <div className="relative flex-1">
           <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
           <input 
             type="text" 
             placeholder="Search candidates by name or email..." 
             className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
           />
         </div>
         <button className="px-6 py-3 bg-card border border-border rounded-2xl flex items-center gap-2 text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition">
           <Filter className="w-5 h-5"/> Filter Results
         </button>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden flex-1 shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground text-sm uppercase tracking-wider">
              <th className="p-6 font-medium">Candidate Info</th>
              <th className="p-6 font-medium">Total Sessions</th>
              <th className="p-6 font-medium">Avg Score</th>
              <th className="p-6 font-medium">Metrics (Fillers / Pace)</th>
              <th className="p-6 font-medium">Max Difficulty</th>
              <th className="p-6 font-medium">Latest Status</th>
              <th className="p-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {loading ? (
               <tr>
                 <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading candidates...</td>
               </tr>
            ) : candidates.length === 0 ? (
               <tr>
                 <td colSpan={7} className="p-8 text-center text-muted-foreground">No candidate registered yet.</td>
               </tr>
            ) : candidates.map(c => {
               const comps = c.sessions.filter((s:any) => s.evaluation);
               const avgScore = comps.length > 0 ? comps.reduce((acc:any,s:any) => acc + s.evaluation.overallScore, 0) / comps.length : 0;
               const maxDiff = comps.length > 0 ? Math.max(...comps.map((s:any) => s.maxDifficultyReached)) : 1;
               const latest = comps[comps.length - 1];

               return (
                <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-6">
                    <div className="font-semibold text-lg">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="p-6 font-medium">{c.sessions.length}</td>
                  <td className="p-6 font-medium text-primary">
                    {comps.length > 0 ? avgScore.toFixed(0) : '-'} / 100
                  </td>
                  <td className="p-6 font-medium text-muted-foreground text-sm">
                    {latest ? (
                       <span>{latest.evaluation.totalFillerWords} Fillers <br/> {latest.evaluation.speakingPace} WPM</span>
                    ) : '-'}
                  </td>
                  <td className="p-6 font-medium">
                     Level {maxDiff}
                  </td>
                  <td className="p-6">
                     {latest ? (
                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${latest.evaluation.recommendation === 'SELECTED' ? 'bg-green-500/20 text-green-500' : latest.evaluation.recommendation === 'REJECTED' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                         {latest.evaluation.recommendation.replace('_', ' ')}
                       </span>
                     ) : <span className="text-muted-foreground text-sm">No completes</span>}
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-sm font-semibold text-accent hover:underline">View Report</button>
                  </td>
                </tr>
               )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
