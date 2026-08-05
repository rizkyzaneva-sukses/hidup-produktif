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

function dariOf(log: any) {
  return Number(log.dari_halaman ?? log.dariHalaman ?? 0);
}

function keOf(log: any) {
  return Number(log.ke_halaman ?? log.keHalaman ?? 0);
}

/** Halaman dibaca = ke − dari (contoh: 332→342 = 10) */
function pagesOf(log: any) {
  return Math.max(0, keOf(log) - dariOf(log));
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
  const nextPage = todayLogs.length > 0 ? keOf(todayLogs[0]) : bookmark;

  function openAdd() {
    setDariHalaman(nextPage ? String(nextPage) : '');
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

  const dariNum = Number(dariHalaman) || 0;
  const keNum = Number(keHalaman) || 0;
  const halamanDibaca = dariNum > 0 && keNum > dariNum ? keNum - dariNum : 0;

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
            {loadingToday || loadingAll ? 'Memuat...' : 'Catat progress halaman harian'}
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Tambah
        </Button>
      </div>

      {/* Summary total 1 hari */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="border-emerald-500/20">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
              {loadingToday ? '—' : todayPages}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Halaman hari ini</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {loadingToday ? '—' : todayLogCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Sesi hari ini</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
              {nextPage ?? '—'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Lanjut halaman</div>
          </CardContent>
        </Card>
      </div>

      {todayPages > 0 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
          <p className="text-sm text-emerald-300">
            Total baca hari ini:{' '}
            <span className="font-bold text-emerald-400 text-base">{todayPages} halaman</span>
            {nextPage != null && (
              <span className="text-slate-400"> · lanjut dari halaman {nextPage}</span>
            )}
          </p>
        </div>
      )}

      {todayLogs.length > 0 && (
        <Card className="border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Detail Hari Ini
              </h3>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">{todayPages} hlm</span>
            </div>
            <div className="space-y-2">
              {todayLogs.map((log: any) => {
                const dari = dariOf(log);
                const ke = keOf(log);
                const pages = pagesOf(log);
                return (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-slate-800/40 group">
                    <BookMarked size={16} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium tabular-nums">{dari}</span>
                        <ArrowRight size={12} className="text-slate-600 shrink-0" />
                        <span className="text-sm text-white font-medium tabular-nums">{ke}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          ({ke} − {dari} = {pages} hlm)
                        </span>
                      </div>
                      {log.catatan && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{log.catatan}</p>
                      )}
                    </div>
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
            <p className="text-white font-medium mb-1">Belum baca hari ini</p>
            <p className="text-slate-500 text-sm mb-5">
              {bookmark
                ? `Lanjutkan dari halaman ${bookmark}`
                : 'Isi dari halaman berapa ke berapa'}
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
            <div className="space-y-4">
              {Object.entries(groupedByDate).map(([date, logs]) => {
                const totalPages = logs.reduce((sum, l) => sum + pagesOf(l), 0);
                const isToday = date === today;
                return (
                  <div key={date} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isToday ? 'Hari ini' : date.split('-').reverse().join('/')}
                      </span>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">
                        Total {totalPages} hlm
                      </span>
                    </div>
                    <div className="space-y-1">
                      {logs.map((log: any) => {
                        const dari = dariOf(log);
                        const ke = keOf(log);
                        const pages = pagesOf(log);
                        return (
                          <div key={log.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded text-xs bg-slate-800/40">
                            <span className="text-slate-300 tabular-nums font-medium">{dari} → {ke}</span>
                            <span className="text-slate-500 font-mono">({ke} − {dari} = {pages})</span>
                            {log.catatan && <span className="text-slate-600 ml-auto truncate max-w-[100px]">{log.catatan}</span>}
                          </div>
                        );
                      })}
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
          <p className="text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
            Rumus: <span className="text-emerald-400 font-medium">Sampai − Dari = halaman dibaca</span>
            <br />
            Contoh: 332 → 342 = <span className="text-white font-medium">10 halaman</span>
          </p>

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
                <p className="text-sm text-emerald-300 font-medium">
                  {keNum} − {dariNum} = {halamanDibaca} halaman dibaca
                </p>
                <p className="text-xs text-slate-500">
                  Lanjut besok dari halaman {keNum}
                </p>
              </div>
            </div>
          )}

          {dariNum > 0 && keNum > 0 && keNum <= dariNum && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              Sampai harus lebih besar dari Dari. Contoh: 332 → 342 (selisih 10).
            </p>
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
