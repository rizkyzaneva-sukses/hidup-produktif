'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { todayStr } from '@/lib/utils';
import { SURAH_LIST, SurahInfo, getHalaman, findSurah, searchSurah } from '@/lib/quran-data';
import { Card, CardContent, Button, Input, Dialog, Badge } from '@/components/ui';
import { BookOpen, Search, Plus, Trash2, ChevronDown, Flame, BookMarked } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function QuranPage() {
  const today = todayStr();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [surahQuery, setSurahQuery] = useState('');
  const [showSurahList, setShowSurahList] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);
  const [ayat, setAyat] = useState('');
  const [halamanManual, setHalamanManual] = useState('');
  const [ayatDibaca, setAyatDibaca] = useState('');
  const [catatan, setCatatan] = useState('');
  const [useManualHalaman, setUseManualHalaman] = useState(false);

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['quran-logs', 'today', today],
    queryFn: () => fetcher(`/api/quran-logs?date=${today}`),
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['quran-logs', 'recent'],
    queryFn: () => fetcher(`/api/quran-logs?limit=30`),
  });

  const filteredSurahs = useMemo(() => searchSurah(surahQuery), [surahQuery]);

  const addLog = useMutation({
    mutationFn: () => {
      let halaman = useManualHalaman ? Number(halamanManual) : null;
      if (!useManualHalaman && selectedSurah) {
        halaman = getHalaman(selectedSurah.nama, Number(ayat));
      }
      return fetch('/api/quran-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          surah: selectedSurah!.nama,
          ayat,
          halaman,
          ayat_dibaca: ayatDibaca || null,
          catatan: catatan || null,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quran-logs'] });
      setShowAdd(false);
      resetForm();
    },
  });

  const deleteLog = useMutation({
    mutationFn: (id: string) => fetch(`/api/quran-logs/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran-logs'] }),
  });

  function resetForm() {
    setSelectedSurah(null);
    setSurahQuery('');
    setShowSurahList(false);
    setAyat('');
    setHalamanManual('');
    setAyatDibaca('');
    setCatatan('');
    setUseManualHalaman(false);
  }

  function selectSurah(s: SurahInfo) {
    setSelectedSurah(s);
    setSurahQuery(s.nama);
    setShowSurahList(false);
    setAyat('');
    setHalamanManual('');
  }

  const halamanAuto = selectedSurah && ayat ? getHalaman(selectedSurah.nama, Number(ayat)) : null;

  const todayPages = (todayLogs as any[]).reduce((sum: number, l: any) => sum + (l.halaman || 0), 0);
  const todaySurahs = (todayLogs as any[]).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-400" />
            Baca Quran
          </h1>
          <p className="text-slate-500 text-sm">
            {todaySurahs > 0
              ? `${todaySurahs} log, ${todayPages} halaman hari ini`
              : 'Belum ada bacaan hari ini'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} className="mr-1" /> Tambah
        </Button>
      </div>

      {todayLogs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Hari Ini</h3>
            <div className="space-y-2">
              {(todayLogs as any[]).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-800/40 group">
                  <BookMarked size={16} className="text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {log.surah} : {log.ayat}
                      {log.ayat_dibaca && log.ayat_dibaca !== log.ayat && ` - ${log.ayat_dibaca}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Hal. {log.halaman}
                      {log.catatan && <span className="ml-2 text-slate-600">— {log.catatan}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteLog.mutate(log.id)}
                    className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {todayLogs.length === 0 && (
        <Card className="border-dashed border-slate-700">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-emerald-400" />
            </div>
            <p className="text-white font-medium mb-1">Mulai baca Quran hari ini</p>
            <p className="text-slate-500 text-sm mb-5">Catat bacaanmu, halaman terisi otomatis dari surah & ayat</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={14} className="mr-1" /> Tambah Bacaan
            </Button>
          </CardContent>
        </Card>
      )}

      {recentLogs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Riwayat Terbaru</h3>
            <div className="space-y-1">
              {(recentLogs as any[]).slice(0, 20).map((log: any) => {
                const isToday = log.date === today;
                return (
                  <div key={log.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${isToday ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'}`}>
                    <span className="text-xs text-slate-600 w-14 shrink-0 font-mono">
                      {log.date === today ? 'Hari ini' : log.date.split('-').reverse().join('/').slice(0, 5)}
                    </span>
                    <BookMarked size={14} className={`shrink-0 ${isToday ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="text-sm text-slate-300 flex-1 truncate">
                      {log.surah} : {log.ayat}
                      {log.ayat_dibaca && log.ayat_dibaca !== log.ayat && ` - ${log.ayat_dibaca}`}
                    </span>
                    <span className="text-xs text-slate-600 shrink-0">Hal. {log.halaman}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Tambah Bacaan Quran">
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Surah</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={surahQuery}
                onChange={e => { setSurahQuery(e.target.value); setShowSurahList(true); setSelectedSurah(null); }}
                onFocus={() => setShowSurahList(true)}
                placeholder="Cari surah... (contoh: Albaqoroh, baqarah, 2)"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            {showSurahList && filteredSurahs.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                {filteredSurahs.map(s => (
                  <button
                    key={s.nomor}
                    onClick={() => selectSurah(s)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 ${selectedSurah?.nomor === s.nomor ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300'}`}
                  >
                    <span className="text-xs text-slate-500 w-7 shrink-0">{s.nomor}</span>
                    <span className="text-sm flex-1">{s.nama}</span>
                    <span className="text-xs text-slate-600">{s.namaArab}</span>
                  </button>
                ))}
              </div>
            )}
            {showSurahList && filteredSurahs.length === 0 && surahQuery.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-center text-sm text-slate-500">
                Surah tidak ditemukan
              </div>
            )}
          </div>

          {selectedSurah && (
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <p className="text-sm text-white font-medium">{selectedSurah.nama} — {selectedSurah.namaArab}</p>
              <p className="text-xs text-slate-500 mt-0.5">{selectedSurah.arti} · {selectedSurah.ayat} ayat · Mulai hal. {selectedSurah.halamanAwal}</p>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Ayat</label>
            <Input
              type="number"
              min={1}
              value={ayat}
              onChange={e => {
                setAyat(e.target.value);
                if (!useManualHalaman && selectedSurah && e.target.value) {
                  const h = getHalaman(selectedSurah.nama, Number(e.target.value));
                  if (h) setHalamanManual(String(h));
                }
              }}
              placeholder="Masukkan nomor ayat awal"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="manualHalaman"
              checked={useManualHalaman}
              onChange={e => {
                setUseManualHalaman(e.target.checked);
                if (!e.target.checked && selectedSurah && ayat) {
                  const h = getHalaman(selectedSurah.nama, Number(ayat));
                  if (h) setHalamanManual(String(h));
                }
              }}
              className="w-4 h-4 accent-blue-500 cursor-pointer rounded"
            />
            <label htmlFor="manualHalaman" className="text-xs text-slate-400 cursor-pointer">Set halaman manual</label>
          </div>

          {halamanAuto && !useManualHalaman && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <BookMarked size={16} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">Halaman {halamanAuto}</p>
                <p className="text-xs text-slate-500">Terisi otomatis dari surah & ayat</p>
              </div>
            </div>
          )}

          {useManualHalaman && (
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Halaman</label>
              <Input
                type="number"
                min={1}
                max={604}
                value={halamanManual}
                onChange={e => setHalamanManual(e.target.value)}
                placeholder="Masukkan halaman manual"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">
              Ayat Dibaca (opsional)
              <span className="text-slate-600 ml-1">— misal: 6-10 jika baca ayat 6 sampai 10</span>
            </label>
            <Input
              value={ayatDibaca}
              onChange={e => setAyatDibaca(e.target.value)}
              placeholder="contoh: 6-10"
            />
          </div>

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
            disabled={!selectedSurah || !ayat || (!useManualHalaman && !halamanAuto) || addLog.isPending}
            onClick={() => addLog.mutate()}
          >
            {addLog.isPending ? 'Menyimpan...' : 'Simpan Bacaan'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
