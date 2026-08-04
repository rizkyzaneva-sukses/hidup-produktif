'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { todayStr } from '@/lib/utils';
import { Card, CardContent, Button, Input, Dialog } from '@/components/ui';
import { BookOpen, Plus, Trash2, BookMarked, ArrowRight } from 'lucide-react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || 'Gagal memuat data');
  return data;
};

function pagesOf(log: any) {
  const dari = Number(log.dari_halaman ?? log.dariHalaman ?? 0);
  const ke = Number(log.ke_halaman ?? log.keHalaman ?? 0);
  return Math.max(0, ke - dari);
}

function dariOf(log: any) {
  return Number(log.dari_halaman ?? log.dariHalaman ?? 0);
}

function keOf(log: any) {
  return Number(log.ke_halaman ?? log.keHalaman ?? 0);
}

export default function QuranPage() {
  const today = todayStr();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [dariHalaman, setDariHalaman] = useState('');
  const [keHalaman, setKeHalaman] = useState('');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: todayLogsRaw = [], isLoading: loadingToday } = useQuery({
    queryKey: ['quran-logs', 'today', today],
    queryFn: () => fetcher(`/api/quran-logs?date=${today}`),
  });

  const { data: allLogsRaw = [], isLoading: loadingAll } = useQuery({
    queryKey: ['quran-logs', 'all'],
    queryFn: () => fetcher(`/api/quran-logs?limit=50`),
  });

  const todayLogs: any[] = Array.isArray(todayLogsRaw) ? todayLogsRaw : [];
  const allLogs: any[] = Array.isArray(allLogsRaw) ? allLogsRaw : [];

  const todayPages = todayLogs.reduce((sum, l) => sum + pagesOf(l), 0);
  const todayLogCount = todayLogs.length;
  const lastLog = allLogs.length > 0 ? allLogs[0] : null;
  const bookmark = lastLog ? keOf(lastLog) : null;

  function openAdd() {
    setDariHalaman(bookmark ? String(bookmark) : '');
    setKeHalaman('');
    setCatatan('');
    setErrorMsg('');
    setShowAdd(true);
  }

  const addLog = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/quran-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          dari_halaman: Number(dariHalaman),
          ke_halaman: Number(keHalaman),
          catatan: catatan || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal menyimpan');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quran-logs'] });
      setShowAdd(false);
      setErrorMsg('');
    },
    onError: (err: any) => setErrorMsg(err?.message || 'Gagal menyimpan'),
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quran-logs/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Gagal menghapus');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran-logs'] }),
  });

  const halamanDibaca = dariHalaman && keHalaman ? Number(keHalaman) - Number(dariHalaman) : 0;

  const groupedByDate = allLogs.reduce((acc: Record<string, any[]>, log: any) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-400" />
            Baca Quran
          </h1>
          <p className="text-slate-500 text-sm">
            {loadingToday || loadingAll
              ? 'Memuat...'
              : todayLogCount > 0
                ? `${todayLogCount} sesi · ${todayPages} halaman hari ini · lanjut hal. ${keOf(todayLogs[0])}`
                : bookmark
                  ? `Belum baca hari ini · lanjut dari hal. ${bookmark}`
                  : 'Belum ada bacaan'}
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Tambah
        </Button>
      </div>

      {todayLogs.length > 0 && (
        <Card className="border-emerald-500/20">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Hari Ini — {todayPages} hlm
            </h3>
            <div className="space-y-2">
              {todayLogs.map((log: any) => {
                const pages = pagesOf(log);
                return (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-slate-800/40 group">
                    <BookMarked size={16} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm text-white font-medium tabular-nums">{dariOf(log)}</span>
                      <ArrowRight size={12} className="text-slate-600 shrink-0" />
                      <span className="text-sm text-white font-medium tabular-nums">{keOf(log)}</span>
                      <span className="text-xs text-emerald-400 font-medium ml-1">({pages} hlm)</span>
                    </div>
                    {log.catatan && (
                      <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-[120px]">{log.catatan}</span>
                    )}
                    <button
                      onClick={() => deleteLog.mutate(log.id)}
                      className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {todayLogs.length === 0 && !loadingToday && (
        <Card className="border-dashed border-slate-700">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-emerald-400" />
            </div>
            <p className="text-white font-medium mb-1">Mulai baca Quran hari ini</p>
            <p className="text-slate-500 text-sm mb-5">
              {bookmark
                ? `Lanjutkan dari halaman ${bookmark}`
                : 'Catat dari halaman berapa ke berapa'}
            </p>
            <Button onClick={openAdd}>
              <Plus size={14} className="mr-1" /> Tambah Bacaan
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.keys(groupedByDate).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Riwayat</h3>
            <div className="space-y-3">
              {Object.entries(groupedByDate).map(([date, logs]) => {
                const totalPages = logs.reduce((sum, l) => sum + pagesOf(l), 0);
                const isToday = date === today;
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-medium ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isToday ? 'Hari ini' : date.split('-').reverse().join('/')}
                      </span>
                      <span className="text-xs text-slate-600">{totalPages} hlm</span>
                    </div>
                    <div className="space-y-1">
                      {logs.map((log: any) => (
                        <div key={log.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded text-xs bg-slate-800/20">
                          <span className="text-slate-400 tabular-nums">{dariOf(log)} → {keOf(log)}</span>
                          <span className="text-emerald-400">({pagesOf(log)} hlm)</span>
                          {log.catatan && <span className="text-slate-600 ml-auto truncate max-w-[100px]">{log.catatan}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Bacaan Quran">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Dari Halaman</label>
              <Input
                type="number"
                min={1}
                max={603}
                value={dariHalaman}
                onChange={e => setDariHalaman(e.target.value)}
                placeholder="332"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Sampai Halaman</label>
              <Input
                type="number"
                min={2}
                max={604}
                value={keHalaman}
                onChange={e => setKeHalaman(e.target.value)}
                placeholder="342"
              />
            </div>
          </div>

          {halamanDibaca > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <BookMarked size={16} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">{halamanDibaca} halaman dibaca</p>
                <p className="text-xs text-slate-500">
                  Hal. {dariHalaman} → {keHalaman} · lanjut besok dari {keHalaman}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{errorMsg}</p>
          )}

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Catatan (opsional)</label>
            <Input
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="contoh: Tadarus setelah Subuh"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!dariHalaman || !keHalaman || halamanDibaca <= 0 || addLog.isPending}
            onClick={() => addLog.mutate()}
          >
            {addLog.isPending ? 'Menyimpan...' : `Simpan — ${halamanDibaca > 0 ? halamanDibaca + ' halaman' : ''}`}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
