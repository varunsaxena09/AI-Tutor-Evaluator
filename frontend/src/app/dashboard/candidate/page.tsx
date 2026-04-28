"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Activity, CheckCircle, AlertTriangle, XCircle, LogOut } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function CandidateDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      
      try {
        const res = await fetch(`https://ai-tutor-evaluator.onrender.com/api/dashboard/candidate`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        } else {
          if (res.status === 401 || res.status === 403) router.push('/login');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  const handleStartInterview = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`https://ai-tutor-evaluator.onrender.com/api/interviews/session`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/interview/${session.id}`);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getRadarData = (evalData: any) => ({
    labels: ['Clarity', 'Warmth', 'Simplicity', 'Patience', 'Fluency'],
    datasets: [
      {
        label: 'Score / 10',
        data: [
          evalData.clarityScore || 0,
          evalData.warmthScore || 0,
          evalData.simplicityScore || 0,
          evalData.patienceScore || 0,
          evalData.fluencyScore || 0,
        ],
        backgroundColor: 'rgba(100, 50, 255, 0.2)',
        borderColor: 'rgba(100, 50, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(100, 50, 255, 1)',
      },
    ],
  });

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(128, 128, 128, 0.2)' },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
        pointLabels: { color: 'gray' },
        ticks: { display: false, min: 0, max: 10 }
      }
    },
    plugins: { legend: { display: false } }
  };

  // Helper: derive correct answers and accuracy from session answers
  const getAccuracyStats = (session: any) => {
    const answers = session.answers || [];
    const total = answers.length || 5;
    const correct = answers.reduce((acc: number, a: any) => {
      const c = (a.correctness || '').toLowerCase();
      if (c === 'correct') return acc + 1;
      if (c === 'partial') return acc + 0.5;
      return acc;
    }, 0);
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    return { correct, total, accuracy };
  };

  return (
    <div className="min-h-screen bg-background p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Your Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and start new evaluations.</p>
          </div>
          <button onClick={logout} className="p-3 bg-card border border-border rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-foreground transition-all flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </header>

        <section className="mb-12">
          <div className="glass-card rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between border border-primary/20 bg-primary/5">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Ready for your next evaluation?</h2>
              <p className="text-muted-foreground mb-6 md:mb-0 max-w-sm">
                Start a 5-question AI-driven interview with adaptive difficulty to assess your tutoring skills.
              </p>
            </div>
            <button
              onClick={handleStartInterview}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(100,50,255,0.4)] transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="fill-current w-5 h-5" />
              Start Interview
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
            <Activity className="w-6 h-6 text-primary" /> Past Evaluations
          </h3>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl text-muted-foreground">
              No evaluations found. Start your first interview above!
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.map((session) => {
                const evalData = session.evaluation;
                const { correct, total, accuracy } = getAccuracyStats(session);

                return (
                  <div key={session.id} className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-transform border border-border flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm text-muted-foreground">{new Date(session.createdAt).toLocaleDateString()}</span>
                        {evalData?.recommendation === 'SELECTED' && <CheckCircle className="text-green-500 w-5 h-5" />}
                        {evalData?.recommendation === 'NEEDS_IMPROVEMENT' && <AlertTriangle className="text-yellow-500 w-5 h-5" />}
                        {evalData?.recommendation === 'REJECTED' && <XCircle className="text-red-500 w-5 h-5" />}
                        {!evalData && <span className="bg-secondary text-xs px-2 py-1 rounded text-secondary-foreground">Incomplete</span>}
                      </div>

                      {evalData ? (
                        <>
                          <div className="mb-4 text-foreground">
                            <div className="text-4xl font-bold mb-2">
                              {evalData.overallScore?.toFixed(0)}
                              <span className="text-xl text-muted-foreground">/100</span>
                            </div>
                            <div
                              className="text-sm font-semibold capitalize"
                              style={{
                                color:
                                  evalData.recommendation === 'SELECTED'
                                    ? '#4ade80'
                                    : evalData.recommendation === 'REJECTED'
                                    ? '#f87171'
                                    : '#facc15',
                              }}
                            >
                              {evalData.recommendation.replace('_', ' ').toLowerCase()}
                            </div>
                            <div className="mt-2 text-xs font-semibold text-primary">
                              Max Difficulty Reached: Level {session.maxDifficultyReached}
                            </div>
                          </div>

                          {/* ✅ 4 stats: Correct Answers, Accuracy, Confidence, Communication */}
                          <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
                            <div className="flex justify-between">
                              <span>Correct Answers</span>
                              <span className="text-foreground font-medium">{correct} / {total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Accuracy</span>
                              <span className="text-foreground font-medium">{accuracy.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Confidence</span>
                              <span className="text-foreground font-medium">{evalData.confidenceScore?.toFixed(1)}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Communication</span>
                              <span className="text-foreground font-medium">{evalData.communicationScore?.toFixed(1)}/10</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          Session was abandoned.
                        </div>
                      )}
                    </div>

                    {evalData && (
                      <div className="flex-1 w-full flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-border pt-6 sm:pt-0 sm:pl-6">
                        <Radar data={getRadarData(evalData)} options={radarOptions} className="max-w-[200px] mb-6" />
                        <div className="grid grid-cols-2 gap-4 w-full text-center">
                          <div className="bg-muted/50 p-2 rounded-xl">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Fillers</div>
                            <div className="text-lg font-bold text-foreground">{evalData.totalFillerWords}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-xl">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Pace (WPM)</div>
                            <div className="text-lg font-bold text-foreground">{evalData.speakingPace?.toFixed(0)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-xl">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Vocab Score</div>
                            <div className="text-lg font-bold text-foreground">{evalData.vocabularyRichness?.toFixed(2)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-xl">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Pauses</div>
                            <div className="text-lg font-bold text-foreground">{evalData.totalPauses}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
