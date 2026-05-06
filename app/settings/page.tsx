'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { SHORTCUTS, ShortcutDef, loadCustomShortcuts, saveCustomShortcut, resetShortcut, formatSyntheticKey } from '@/lib/shortcuts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Shortcut Key Display ──────────────────────────────────────────────────────
function KeyBadge({ combo }: { combo: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {combo.split('+').map((k, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && <span className="text-slate-600 text-[10px]">+</span>}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600 text-slate-300 text-[11px] font-mono leading-none">{k}</kbd>
        </span>
      ))}
    </span>
  );
}

// ── Key Recorder ──────────────────────────────────────────────────────────────
function KeyRecorder({ value, defaultKey, onChange, onReset }: { value: string; defaultKey: string; onChange: (k: string) => void; onReset: () => void; }) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') { setRecording(false); return; }
    const combo = formatSyntheticKey(e);
    if (combo) { onChange(combo); setRecording(false); }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        tabIndex={0}
        onClick={() => setRecording(true)}
        onKeyDown={recording ? handleKeyDown : undefined}
        onBlur={() => setRecording(false)}
        className={`px-2.5 py-1.5 rounded-lg cursor-pointer border text-xs transition-all select-none ${
          recording
            ? 'border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30'
            : 'border-slate-600 bg-slate-800 hover:border-slate-500'
        }`}
      >
        {recording ? (
          <span className="animate-pulse text-blue-400">Tekan tombol...</span>
        ) : (
          <KeyBadge combo={value} />
        )}
      </div>
      {value !== defaultKey && (
        <button onClick={onReset} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors">
          reset
        </button>
      )}
    </div>
  );
}

// ── Shortcuts Tab ─────────────────────────────────────────────────────────────
function ShortcutsTab() {
  const [customKeys, setCustomKeys] = useState<Record<string, string>>({});

  useEffect(() => { setCustomKeys(loadCustomShortcuts()); }, []);

  const handleChange = (id: string, key: string) => {
    saveCustomShortcut(id, key);
    setCustomKeys(prev => ({ ...prev, [id]: key }));
  };

  const handleReset = (id: string, defaultKey: string) => {
    resetShortcut(id);
    setCustomKeys(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const groups: { key: ShortcutDef['group']; label: string; icon: string }[] = [
    { key: 'global', label: 'Global', icon: '🌐' },
    { key: 'form', label: 'Form', icon: '📝' },
    { key: 'nav', label: 'Navigasi', icon: '🧭' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Klik tombol shortcut lalu tekan kombinasi baru untuk mengubah. Esc untuk batal. Perubahan aktif setelah reload halaman.</p>
      {groups.map(g => {
        const items = SHORTCUTS.filter(s => s.group === g.key);
        return (
          <Card key={g.key}>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <span>{g.icon}</span>
                <h2 className="font-semibold text-white text-sm">{g.label}</h2>
              </div>
              <div className="space-y-2">
                {items.map(s => {
                  const effectiveKey = customKeys[s.id] || s.defaultKey;
                  const isModified = !!customKeys[s.id] && customKeys[s.id] !== s.defaultKey;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-700/50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm text-white flex items-center gap-2">
                          {s.label}
                          {isModified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">diubah</span>}
                        </p>
                        <p className="text-xs text-slate-500">{s.description}</p>
                      </div>
                      {s.editable ? (
                        <KeyRecorder
                          value={effectiveKey}
                          defaultKey={s.defaultKey}
                          onChange={k => handleChange(s.id, k)}
                          onReset={() => handleReset(s.id, s.defaultKey)}
                        />
                      ) : (
                        <KeyBadge combo={effectiveKey} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <p className="text-[11px] text-slate-600 text-center">Shortcut navigasi aktif di seluruh halaman. Shortcut form aktif saat dialog terbuka.</p>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'config' | 'shortcuts'>('config');
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: config } = useQuery({ queryKey: ['config'], queryFn: () => fetcher('/api/config') });

  useEffect(() => {
    if (config?.TELEGRAM_CHAT_ID) setChatId(config.TELEGRAM_CHAT_ID);
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: (d: any) => fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config'] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const handleSave = () => {
    const data: any = { TELEGRAM_CHAT_ID: chatId };
    if (token) data.TELEGRAM_BOT_TOKEN = token;
    saveConfig.mutate(data);
  };

  const testTelegram = async () => {
    setTesting(true); setTestResult(null);
    const res = await fetch('/api/telegram-test', { method: 'POST' });
    const data = await res.json();
    setTestResult(data.ok ? '✅ Berhasil! Cek Telegram kamu.' : `❌ Gagal: ${data.error}`);
    setTesting(false);
  };

  const runCron = async () => {
    const res = await fetch('/api/telegram-test');
    const data = await res.json();
    alert(data.messages?.join('\n') || 'Tidak ada notifikasi untuk dikirim hari ini.');
  };

  const TABS = [
    { id: 'config', label: '⚙️ Konfigurasi' },
    { id: 'shortcuts', label: '⌨️ Shortcut' },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-slate-400 text-sm">Konfigurasi aplikasi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Config tab */}
      {tab === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📱</span>
                <h2 className="font-semibold text-white">Telegram Bot</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Bot Token</label>
                  <Input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder={config?.TELEGRAM_BOT_TOKEN_SET ? '••••••••• (sudah diset, kosongkan untuk tidak mengubah)' : 'Masukkan token dari @BotFather'}
                  />
                  <p className="text-xs text-slate-500 mt-1">Dapatkan dari <span className="text-blue-400">@BotFather</span> di Telegram → /newbot</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Chat ID</label>
                  <Input value={chatId} onChange={e => setChatId(e.target.value)} placeholder="Contoh: 123456789" />
                  <p className="text-xs text-slate-500 mt-1">Dapatkan dari <span className="text-blue-400">@userinfobot</span> → kirim pesan /start</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">{saved ? '✅ Tersimpan!' : 'Simpan Konfigurasi'}</Button>
                  <Button variant="outline" onClick={testTelegram} disabled={testing}>{testing ? 'Testing...' : '🧪 Test'}</Button>
                </div>
                {testResult && (
                  <div className={`p-3 rounded-lg text-sm ${testResult.startsWith('✅') ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                    {testResult}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⏰</span>
                <h2 className="font-semibold text-white">Notifikasi Harian</h2>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Cron job berjalan otomatis setiap pagi 07:00 WIB untuk mengirim reminder dan alert subscription H-7.
              </p>
              <Button variant="outline" onClick={runCron}>🔔 Jalankan Sekarang (Manual)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="font-semibold text-white mb-3">📖 Cara Setup Telegram Bot</h2>
              <ol className="space-y-2 text-sm text-slate-400">
                <li>1. Buka Telegram, cari <span className="text-blue-400">@BotFather</span></li>
                <li>2. Kirim <code className="bg-slate-700 px-1 rounded">/newbot</code> → ikuti instruksi → dapatkan token</li>
                <li>3. Cari <span className="text-blue-400">@userinfobot</span> → kirim <code className="bg-slate-700 px-1 rounded">/start</code> → catat ID kamu</li>
                <li>4. Masukkan token dan ID di form di atas → klik Simpan</li>
                <li>5. Klik "🧪 Test" untuk verifikasi koneksi</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shortcuts tab */}
      {tab === 'shortcuts' && <ShortcutsTab />}
    </div>
  );
}
