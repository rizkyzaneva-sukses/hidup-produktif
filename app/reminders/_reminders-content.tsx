'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ROLES, FREQUENCIES } from '@/lib/constants';
import { Button, Input, Select, Dialog, EmptyState, Badge, Toggle } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const FREQ_COLORS: Record<string, any> = { Sekali: 'slate', Harian: 'default', Mingguan: 'purple', Bulanan: 'success' };

const EMPTY_FORM = { title: '', role: 'CEO', date: '', frequency: 'Harian' };

function ReminderForm({ data, setData, onSave, onClose }: {
  data: any;
  setData: (fn: (p: any) => any) => void;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Judul reminder *"
        value={data.title}
        onChange={(e: any) => setData((p: any) => ({ ...p, title: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select
          options={ROLES.map(r => ({ value: r, label: r }))}
          value={data.role}
          onChange={(e: any) => setData((p: any) => ({ ...p, role: e.target.value }))}
        />
        <Select
          options={FREQUENCIES.map(f => ({ value: f, label: f }))}
          value={data.frequency}
          onChange={(e: any) => setData((p: any) => ({ ...p, frequency: e.target.value }))}
        />
        <Input
          type="date"
          value={data.date}
          onChange={(e: any) => setData((p: any) => ({ ...p, date: e.target.value }))}
          className="col-span-2"
        />
      </div>
      <p className="text-xs text-slate-500">
        {data.frequency === 'Harian'
          ? 'Dikirim setiap hari pukul 07:00 WIB sampai dimatikan'
          : data.frequency === 'Sekali'
          ? 'Dikirim sekali pada tanggal yang dipilih'
          : data.frequency === 'Mingguan'
          ? 'Dikirim tiap minggu pada hari yang sama dengan tanggal dipilih'
          : 'Dikirim tiap bulan pada tanggal yang sama'}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => onSave(data)} disabled={!data.title.trim()} className="flex-1">Simpan</Button>
        <Button variant="outline" onClick={onClose}>Batal</Button>
      </div>
    </div>
  );
}

function isOverdue(r: any): boolean {
  if (!r.date) return false;
  const today = new Date().toISOString().split('T')[0];
  return r.date < today;
}

export default function RemindersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showArchived, setShowArchived] = useState(false);

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', showArchived],
    queryFn: () => fetcher(showArchived ? '/api/reminders?archived=true' : '/api/reminders'),
  });

  const create = useMutation({
    mutationFn: (d: any) => fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reminders'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/reminders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reminders'] }); setEditItem(null); },
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/reminders/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const archive = useMutation({
    mutationFn: (id: string) => fetch(`/api/reminders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const unarchive = useMutation({
    mutationFn: (id: string) => fetch(`/api/reminders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: false }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const activeCount = reminders.filter((r: any) => r.active).length;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Reminders</h1>
          <p className="text-slate-400 text-sm">{activeCount} aktif · Notifikasi via Telegram</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowArchived(v => !v)}>
            {showArchived ? '← Aktif' : '📦 Arsip'}
          </Button>
          {!showArchived && <Button size="sm" onClick={() => setShowForm(true)}>+ Reminder</Button>}
        </div>
      </div>

      {reminders.length === 0
        ? <EmptyState  title={showArchived ? 'Belum ada arsip' : 'Belum ada reminder'} desc={showArchived ? 'Reminder yang diarsipkan akan muncul di sini' : 'Tambah reminder dan terima notifikasi di Telegram'} />
        : (
          <div className="space-y-2">
            {reminders.map((r: any) => {
              const overdue = isOverdue(r) && r.frequency === 'Sekali';
              return (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border ${overdue ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700/50 bg-slate-800/40'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${r.active ? 'text-white' : 'text-slate-500'}`}>{r.title}</p>
                      {overdue && <Badge variant="danger">Terlewat</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <RoleBadge role={r.role} />
                      <Badge variant={FREQ_COLORS[r.frequency]}>{r.frequency}</Badge>
                      {r.date && <span className={`text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>{r.date}</span>}
                    </div>
                  </div>
                  {showArchived ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => unarchive.mutate(r.id)} className="h-7 text-xs px-2">Aktifkan</Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)} className="h-7 w-7 text-red-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 flex-shrink-0">
                      <Toggle checked={r.active} onChange={v => update.mutate({ id: r.id, active: v })} />
                      <Button size="icon" variant="ghost" onClick={() => setEditItem(r)} className="h-7 w-7">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => archive.mutate(r.id)} className="h-7 w-7 text-slate-400" title="Arsipkan">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)} className="h-7 w-7 text-red-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Tambah Reminder">
        <ReminderForm data={form} setData={setForm} onSave={(d) => create.mutate(d)} onClose={() => setShowForm(false)} />
      </Dialog>

      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Edit Reminder">
        {editItem && (
          <ReminderForm data={editItem} setData={setEditItem} onSave={(d) => update.mutate({ id: editItem.id, ...d })} onClose={() => setEditItem(null)} />
        )}
      </Dialog>
    </div>
  );
}
