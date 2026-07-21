'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { SUB_CATEGORIES } from '@/lib/constants';
import { formatRupiah } from '@/lib/utils';
import { Button, Input, Select, Dialog, EmptyState } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const EMPTY_FORM = { nama: '', nominal: '', tanggal_renewal: '', kategori: 'Software', status: 'Aktif' };

const EXTENDED_CATEGORIES = ['Software', 'Ecourse', 'Tools', 'Membership', 'Lainnya'];

function getDaysUntilRenewal(dateStr: string): number {
  const renewal = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function RenewalBadge({ dateStr }: { dateStr: string }) {
  const days = getDaysUntilRenewal(dateStr);
  if (days < 0) return <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Lewat</span>;
  if (days === 0) return <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">HARI INI</span>;
  if (days === 1) return <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/80 text-white font-bold">🚨 BESOK</span>;
  if (days <= 3) return <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/80 text-white font-semibold">🔴 H-{days}</span>;
  if (days <= 7) return <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/70 text-white">⚠️ H-{days}</span>;
  return null;
}

function SubForm({ data, setData, onSave, onClose }: {
  data: any;
  setData: (fn: (p: any) => any) => void;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Nama tool/ecourse *"
        value={data.nama}
        onChange={(e: any) => setData((p: any) => ({ ...p, nama: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Nominal/bulan (Rp)"
          type="number"
          value={data.nominal}
          onChange={(e: any) => setData((p: any) => ({ ...p, nominal: e.target.value }))}
        />
        <Input
          type="date"
          value={data.tanggal_renewal}
          onChange={(e: any) => setData((p: any) => ({ ...p, tanggal_renewal: e.target.value }))}
        />
        <Select
          options={EXTENDED_CATEGORIES.map(c => ({ value: c, label: c }))}
          value={data.kategori}
          onChange={(e: any) => setData((p: any) => ({ ...p, kategori: e.target.value }))}
        />
        <Select
          options={['Aktif', 'Berhenti'].map(s => ({ value: s, label: s }))}
          value={data.status}
          onChange={(e: any) => setData((p: any) => ({ ...p, status: e.target.value }))}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => { if (!data.nama.trim()) return; onSave(data); }} className="flex-1">Simpan</Button>
        <Button variant="outline" onClick={onClose}>Batal</Button>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [groupBy, setGroupBy] = useState(true);

  const { data: subs = [] } = useQuery({ queryKey: ['subscriptions'], queryFn: () => fetcher('/api/subscriptions') });

  const create = useMutation({
    mutationFn: (d: any) => fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, nominal: parseInt(d.nominal) || 0 }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/subscriptions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, nominal: parseInt(d.nominal) || 0 }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); setEditItem(null); },
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/subscriptions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const activeSubs = subs.filter((s: any) => s.status === 'Aktif');
  const totalBulan = activeSubs.reduce((sum: number, s: any) => sum + (s.nominal || 0), 0);
  const totalTahun = totalBulan * 12;

  const today = new Date();
  const in7Str = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const urgentSubs = activeSubs.filter((s: any) => s.tanggal_renewal && s.tanggal_renewal <= in7Str && s.tanggal_renewal >= todayStr)
    .sort((a: any, b: any) => a.tanggal_renewal.localeCompare(b.tanggal_renewal));

  // Group by kategori
  const grouped = EXTENDED_CATEGORIES.reduce((acc: Record<string, any[]>, cat) => {
    const items = subs.filter((s: any) => s.kategori === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  // Items with unknown kategori
  const knownCats = new Set(EXTENDED_CATEGORIES);
  const unknownItems = subs.filter((s: any) => !knownCats.has(s.kategori));
  if (unknownItems.length > 0) grouped['Lainnya'] = [...(grouped['Lainnya'] || []), ...unknownItems];

  const SubRow = ({ s }: { s: any }) => {
    const isNear = s.status === 'Aktif' && s.tanggal_renewal && s.tanggal_renewal <= in7Str && s.tanggal_renewal >= todayStr;
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        s.status === 'Berhenti' ? 'border-slate-700/30 bg-slate-800/20 opacity-50'
        : isNear ? 'border-amber-500/40 bg-amber-500/5'
        : 'border-slate-700/50 bg-slate-800/40'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${s.status === 'Berhenti' ? 'text-slate-500 line-through' : 'text-white'}`}>{s.nama}</p>
            {s.status === 'Berhenti' && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Berhenti</span>}
            {s.tanggal_renewal && s.status === 'Aktif' && <RenewalBadge dateStr={s.tanggal_renewal} />}
          </div>
          <div className="flex gap-3 mt-0.5">
            <span className="text-xs text-slate-400">{formatRupiah(s.nominal)}/bln</span>
            {s.tanggal_renewal && <span className="text-xs text-slate-500">Renewal: {s.tanggal_renewal}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="sm" variant={s.status === 'Aktif' ? 'destructive' : 'secondary'}
            onClick={() => update.mutate({ id: s.id, status: s.status === 'Aktif' ? 'Berhenti' : 'Aktif' })}
            className="h-7 text-xs px-2">
            {s.status === 'Aktif' ? 'Cancel' : 'Aktifkan'}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditItem({ ...s, nominal: String(s.nominal) })} className="h-7 w-7">✏️</Button>
          <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)} className="h-7 w-7 text-red-400">🗑</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Subscription Tracker</h1>
          <p className="text-slate-400 text-sm">{activeSubs.length} aktif · {formatRupiah(totalBulan)}/bln · {formatRupiah(totalTahun)}/thn</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setGroupBy(v => !v)}>
            {groupBy ? '📄 Flat' : '📂 Grup'}
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>+ Langganan</Button>
        </div>
      </div>

      {/* Urgent renewal alert */}
      {urgentSubs.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-amber-400 text-sm font-medium">⚠️ {urgentSubs.length} subscription renewal dalam 7 hari</p>
          {urgentSubs.map((s: any) => {
            const days = getDaysUntilRenewal(s.tanggal_renewal);
            const label = days === 0 ? 'HARI INI' : days === 1 ? 'besok' : `H-${days}`;
            return (
              <p key={s.id} className="text-amber-300/70 text-xs mt-1">
                • {s.nama} — <span className="font-semibold">{label}</span> ({formatRupiah(s.nominal)}/bln)
              </p>
            );
          })}
        </div>
      )}

      {subs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-white font-medium">Belum ada langganan</p>
          <p className="text-slate-400 text-sm mt-1">Tambah software atau ecourse yang kamu langgani</p>
        </div>
      ) : groupBy ? (
        // Grouped view
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => {
            const catTotal = (items as any[]).filter(s => s.status === 'Aktif').reduce((sum, s) => sum + (s.nominal || 0), 0);
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cat}</span>
                  {catTotal > 0 && <span className="text-xs text-slate-500">{formatRupiah(catTotal)}/bln</span>}
                </div>
                <div className="space-y-2">
                  {(items as any[]).map(s => <SubRow key={s.id} s={s} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat view
        <div className="space-y-2">
          {subs.map((s: any) => <SubRow key={s.id} s={s} />)}
        </div>
      )}

      {/* Summary footer */}
      {activeSubs.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Total aktif/bulan</span>
            <span className="font-semibold text-white">{formatRupiah(totalBulan)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Estimasi/tahun</span>
            <span className="font-semibold text-amber-400">{formatRupiah(totalTahun)}</span>
          </div>
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="💳 Tambah Langganan">
        <SubForm data={form} setData={setForm} onSave={(d) => create.mutate(d)} onClose={() => setShowForm(false)} />
      </Dialog>

      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Edit Langganan">
        {editItem && (
          <SubForm data={editItem} setData={setEditItem} onSave={(d) => update.mutate({ id: editItem.id, ...d })} onClose={() => setEditItem(null)} />
        )}
      </Dialog>
    </div>
  );
}
