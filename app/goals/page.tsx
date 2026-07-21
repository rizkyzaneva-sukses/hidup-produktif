'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, format, getQuarter, getYear, addWeeks } from 'date-fns';
import { id } from 'date-fns/locale';
import { ROLES } from '@/lib/constants';
import { Card, CardContent, Button, Input, Select, EmptyState, ProgressBar } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface WeeklyGoal { id: string; role: string; title: string; target: number; completed: number; week_start: string; }
interface QuarterlyGoal { id: string; title: string; key_results: string; progress: number; quarter: number; year: number; }

export default function GoalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'Mingguan' | 'Quarterly'>('Mingguan');
  const [showAddWeekly, setShowAddWeekly] = useState(false);
  const [showAddQuarterly, setShowAddQuarterly] = useState(false);
  const [editingKR, setEditingKR] = useState<string | null>(null);

  // Quarterly filters
  const now = new Date();
  const [qYear, setQYear] = useState(getYear(now));
  const [qQuarter, setQQuarter] = useState(getQuarter(now));

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Weekly goals
  const { data: weeklyGoals = [] } = useQuery({
    queryKey: ['weekly-goals', weekStart],
    queryFn: () => fetcher(`/api/weekly-goals?week_start=${weekStart}`),
  });

  // Quarterly goals
  const { data: quarterlyGoals = [] } = useQuery({
    queryKey: ['quarterly-goals', qYear, qQuarter],
    queryFn: () => fetcher(`/api/quarterly-goals?quarter=${qQuarter}&year=${qYear}`),
  });

  // Mutations
  const createWeeklyGoal = useMutation({
    mutationFn: (data: any) => fetch('/api/weekly-goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['weekly-goals'] }); setShowAddWeekly(false); },
  });

  const incrementWeeklyGoal = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: number }) =>
      fetch(`/api/weekly-goals/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly-goals'] }),
  });

  const deleteWeeklyGoal = useMutation({
    mutationFn: (id: string) => fetch(`/api/weekly-goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly-goals'] }),
  });

  const createQuarterlyGoal = useMutation({
    mutationFn: (data: any) => fetch('/api/quarterly-goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quarterly-goals'] }); setShowAddQuarterly(false); },
  });

  const updateQuarterlyGoal = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/quarterly-goals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quarterly-goals'] }); setEditingKR(null); },
  });

  const deleteQuarterlyGoal = useMutation({
    mutationFn: (id: string) => fetch(`/api/quarterly-goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quarterly-goals'] }),
  });

  // Group weekly goals by role
  const goalsByRole = useMemo(() => {
    const groups: Record<string, WeeklyGoal[]> = {};
    for (const goal of weeklyGoals) {
      if (!groups[goal.role]) groups[goal.role] = [];
      groups[goal.role].push(goal);
    }
    return groups;
  }, [weeklyGoals]);

  const totalWeekly = weeklyGoals.reduce((sum: number, g: WeeklyGoal) => sum + g.completed, 0);
  const totalTarget = weeklyGoals.reduce((sum: number, g: WeeklyGoal) => sum + g.target, 0);

  const yearOptions = [qYear - 1, qYear, qYear + 1].map(y => ({ value: String(y), label: String(y) }));
  const quarterOptions = [
    { value: '1', label: 'Q1 (Jan-Mar)' },
    { value: '2', label: 'Q2 (Apr-Jun)' },
    { value: '3', label: 'Q3 (Jul-Sep)' },
    { value: '4', label: 'Q4 (Okt-Des)' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white">Goals</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Tujuan mingguan & quarterly</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg">
        {(['Mingguan', 'Quarterly'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:text-white'
            }`}>
            {t === 'Mingguan' ? 'Mingguan' : 'Quarterly'}
          </button>
        ))}
      </div>

      {/* ──── Weekly Goals ──── */}
      {tab === 'Mingguan' && (
        <div className="space-y-4">
          {/* Week summary */}
          {weeklyGoals.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Minggu ini</p>
                  <p className="text-xs text-slate-400">{totalWeekly}/{totalTarget} selesai</p>
                </div>
                <ProgressBar value={totalWeekly} max={totalTarget} colorClass="bg-blue-500" />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Goal mingguan</p>
            <Button size="sm" onClick={() => setShowAddWeekly(true)}>+ Goal</Button>
          </div>

          {weeklyGoals.length === 0 && <EmptyState  title="Belum ada goal" desc="Tambah goal mingguan pertamamu" />}

          {Object.entries(goalsByRole).map(([role, goals]) => (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <RoleBadge role={role} size="md" />
                <span className="text-xs text-slate-500">{goals.length} goal</span>
              </div>
              {goals.map((goal: WeeklyGoal) => (
                <Card key={goal.id}>
                  <CardContent className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{goal.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <ProgressBar value={goal.completed} max={goal.target} colorClass="bg-blue-500" className="flex-1" />
                        <span className="text-xs text-slate-400 flex-shrink-0">{goal.completed}/{goal.target}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost"
                        onClick={() => incrementWeeklyGoal.mutate({ id: goal.id, completed: Math.min(goal.completed + 1, goal.target) })}
                        disabled={goal.completed >= goal.target}
                        className="h-8 w-8 text-lg">+</Button>
                      <Button size="icon" variant="ghost"
                        onClick={() => deleteWeeklyGoal.mutate(goal.id)}
                        className="h-8 w-8 text-red-400 text-xs">🗑</Button>
                    </div>
                    {goal.completed >= goal.target && (
                      <span className="text-green-400 text-xs font-medium flex-shrink-0">✅</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ──── Quarterly Goals ──── */}
      {tab === 'Quarterly' && (
        <div className="space-y-4">
          {/* Quarter selector */}
          <div className="flex gap-2">
            <Select options={quarterOptions} value={String(qQuarter)} onChange={e => setQQuarter(Number(e.target.value))} className="flex-1" />
            <Select options={yearOptions} value={String(qYear)} onChange={e => setQYear(Number(e.target.value))} className="w-24" />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">OKR Q{qQuarter} {qYear}</p>
            <Button size="sm" onClick={() => setShowAddQuarterly(true)}>+ OKR</Button>
          </div>

          {quarterlyGoals.length === 0 && <EmptyState  title="Belum ada OKR" desc="Buat goal quarterly pertamamu" />}

          <div className="space-y-3">
            {quarterlyGoals.map((goal: QuarterlyGoal) => {
              let keyResults: string[] = [];
              try { keyResults = JSON.parse(goal.key_results || '[]'); } catch {}
              return (
                <Card key={goal.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{goal.title}</p>
                        {keyResults.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {keyResults.map((kr, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                <span className="text-xs text-slate-300">{kr}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => setEditingKR(goal.id)} className="h-8 w-8">✏️</Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteQuarterlyGoal.mutate(goal.id)} className="h-8 w-8 text-red-400">🗑</Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={goal.progress} max={100} colorClass="bg-blue-500" className="flex-1" />
                      <span className="text-xs text-slate-400">{goal.progress}%</span>
                    </div>
                    {/* Inline KR editor */}
                    {editingKR === goal.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                        <KREditor goal={goal} onSave={(data) => updateQuarterlyGoal.mutate({ id: goal.id, ...data })} onCancel={() => setEditingKR(null)} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Weekly Goal Dialog */}
      {showAddWeekly && (
        <AddWeeklyGoalForm
          weekStart={weekStart}
          onCreate={createWeeklyGoal.mutate}
          onCancel={() => setShowAddWeekly(false)}
        />
      )}

      {/* Add Quarterly Goal Dialog */}
      {showAddQuarterly && (
        <AddQuarterlyGoalForm
          quarter={qQuarter}
          year={qYear}
          onCreate={createQuarterlyGoal.mutate}
          onCancel={() => setShowAddQuarterly(false)}
        />
      )}
    </div>
  );
}

// ── Add Weekly Goal Form ──
function AddWeeklyGoalForm({ weekStart, onCreate, onCancel }: { weekStart: string; onCreate: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ role: 'CEO', title: '', target: 5 });
  const submit = () => { if (!form.title.trim()) return; onCreate({ ...form, week_start: weekStart }); };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full sm:max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-t-xl sm:rounded-lg p-4">
        <h2 className="text-sm sm:text-base font-semibold text-white mb-3">➕ Tambah Goal Mingguan</h2>
        <div className="space-y-3">
          <Input placeholder="Judul goal *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Select options={ROLES.map(r => ({ value: r, label: r }))} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target jumlah</label>
            <Input type="number" min={1} value={form.target} onChange={e => setForm(p => ({ ...p, target: Number(e.target.value) || 1 }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} className="flex-1" disabled={!form.title.trim()}>Simpan</Button>
            <Button variant="outline" onClick={onCancel}>Batal</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Quarterly Goal Form ──
function AddQuarterlyGoalForm({ quarter, year, onCreate, onCancel }: { quarter: number; year: number; onCreate: (d: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [keyResultsText, setKeyResultsText] = useState('');
  const submit = () => {
    if (!title.trim()) return;
    const krLines = keyResultsText.split('\n').map(l => l.trim()).filter(Boolean);
    onCreate({ title, key_results: JSON.stringify(krLines), progress: 0, quarter, year });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full sm:max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-t-xl sm:rounded-lg p-4">
        <h2 className="text-sm sm:text-base font-semibold text-white mb-3">➕ Tambah OKR Q{quarter}</h2>
        <div className="space-y-3">
          <Input placeholder="Judul objektif *" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea
            placeholder="Key Results (satu per baris)&#10;Contoh:&#10;Mencapai revenue Rp 100jt&#10;Memiliki 500 user aktif"
            value={keyResultsText} onChange={e => setKeyResultsText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={submit} className="flex-1" disabled={!title.trim()}>Simpan</Button>
            <Button variant="outline" onClick={onCancel}>Batal</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Key Results Editor ──
function KREditor({ goal, onSave, onCancel }: { goal: QuarterlyGoal; onSave: (d: any) => void; onCancel: () => void }) {
  let keyResults: string[] = [];
  try { keyResults = JSON.parse(goal.key_results || '[]'); } catch {}
  const [text, setText] = useState(keyResults.join('\n'));
  const [progress, setProgress] = useState(goal.progress);
  return (
    <div className="space-y-2">
      <textarea
        value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="Key Results (satu per baris)"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Progress:</label>
        <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className="flex-1 accent-blue-500" />
        <span className="text-xs text-slate-300 w-10 text-right">{progress}%</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => {
          const krLines = text.split('\n').map(l => l.trim()).filter(Boolean);
          onSave({ key_results: JSON.stringify(krLines), progress });
        }}>Simpan</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
}
