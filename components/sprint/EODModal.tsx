'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, Button, Textarea } from '@/components/ui';

const EOD_STATUSES = ['Selesai', 'Sebagian — lanjut besok', 'Tidak dikerjakan'];

interface EODModalProps { sprint: any; onClose: () => void; liveTasks?: any[]; }
export function EODModal({ sprint, onClose, liveTasks }: EODModalProps) {
  const qc = useQueryClient();
  const tasks: any[] = sprint.tasks || [];

  // Build a lookup for live task completion status
  const taskMap = new Map<string, any>();
  for (const lt of (liveTasks || [])) taskMap.set(lt.id, lt);

  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const t of tasks) {
      const existing = sprint.eod_task_statuses?.find((s: any) => s.task_id === t.task_id);
      const liveTask = taskMap.get(t.task_id);
      init[t.task_id] = existing?.status || (liveTask?.completed ? 'Selesai' : '');
    }
    return init;
  });
  const [notes, setNotes] = useState(sprint.eod_notes || '');
  const [saving, setSaving] = useState(false);

  const allFilled = tasks.every(t => !!statuses[t.task_id]);

  const handleSave = async () => {
    if (!allFilled) return;
    setSaving(true);
    const eod_task_statuses = tasks.map(t => ({ task_id: t.task_id, task_title: t.task_title, status: statuses[t.task_id] }));
    await fetch(`/api/sprints/${sprint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eod_task_statuses, eod_notes: notes, eod_submitted_at: new Date().toISOString() }),
    });
    qc.invalidateQueries({ queryKey: ['home-sprint'] });
    qc.invalidateQueries({ queryKey: ['sprint'] });
    setSaving(false);
    onClose();
  };

  const statusColor: Record<string, string> = {
    'Selesai': 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
    'Sebagian — lanjut besok': 'border-yellow-500 bg-yellow-500/15 text-yellow-300',
    'Tidak dikerjakan': 'border-red-500 bg-red-500/15 text-red-300',
  };

  const statusShort: Record<string, string> = {
    'Selesai': 'Selesai',
    'Sebagian — lanjut besok': 'Sebagian',
    'Tidak dikerjakan': 'Tidak',
  };

  return (
    <Dialog open title="Tutup Hari Ini" onClose={onClose} className="max-w-md">
      <div className="space-y-4">
        <p className="text-slate-400 text-xs sm:text-sm">Bagaimana task-task sprint hari ini?</p>
        {tasks.map((t: any) => (
          <div key={t.task_id} className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-white">{t.task_title}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {EOD_STATUSES.map(s => (
                <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [t.task_id]: s }))}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs border transition-all active:scale-95 ${statuses[t.task_id] === s ? statusColor[s] : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  <span className="sm:hidden">{statusShort[s]}</span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="text-xs sm:text-sm text-slate-400 block mb-1.5">Catatan EOD (opsional)</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Refleksi singkat hari ini..." />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!allFilled || saving} className="flex-1">
            {saving ? 'Menyimpan...' : 'Simpan & Tutup'}
          </Button>
          <Button variant="outline" onClick={onClose}>Batal</Button>
        </div>
        {!allFilled && <p className="text-xs text-amber-400 text-center">Semua task harus diberi status dulu</p>}
      </div>
    </Dialog>
  );
}
