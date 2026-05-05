'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SettingsPage() {
  const qc = useQueryClient();
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: config } = useQuery({ queryKey: ['config'], queryFn: () => fetcher('/api/config') });

  useEffect(() => {
    if (config) {
      if (config.TELEGRAM_CHAT_ID) setChatId(config.TELEGRAM_CHAT_ID);
    }
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
    setTesting(true);
    setTestResult(null);
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

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-slate-400 text-sm">Konfigurasi aplikasi</p>
      </div>

      {/* Telegram Bot */}
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
              <Input
                value={chatId}
                onChange={e => setChatId(e.target.value)}
                placeholder="Contoh: 123456789"
              />
              <p className="text-xs text-slate-500 mt-1">Dapatkan dari <span className="text-blue-400">@userinfobot</span> → kirim pesan /start</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {saved ? '✅ Tersimpan!' : 'Simpan Konfigurasi'}
              </Button>
              <Button variant="outline" onClick={testTelegram} disabled={testing}>
                {testing ? 'Testing...' : '🧪 Test'}
              </Button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${testResult.startsWith('✅') ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                {testResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cron manual trigger */}
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

      {/* How to get token */}
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
  );
}
