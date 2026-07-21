'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, Badge, Button, Input } from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  id: string;
  emoji: string;
  title: string;
  category: 'core' | 'kelola' | 'baru';
  description: string;
  actions: string[];
  tips?: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  // Core Features
  {
    id: 'beranda',
    emoji: '🏠',
    title: 'Beranda',
    category: 'core',
    description: 'Dashboard utama dengan kartu statistik, waktu sholat Cimahi, kalender, dan progress per role. Semua info penting ada di satu halaman.',
    actions: [
      'Lihat ringkasan task hari ini dan progres per role',
      'Cek waktu sholat (otomatis untuk Cimahi)',
      'Klik role untuk lihat detail aktivitas per peran',
      'Lihat kalender untuk overview mingguan',
    ],
    tips: [
      'Klik role badge untuk navigasi cepat ke detail role',
      'Stat card menampilkan jumlah task aktif dan habit hari ini',
    ],
  },
  {
    id: 'daily-sprint',
    emoji: '🎯',
    title: 'Daily Sprint',
    category: 'core',
    description: 'Rencanakan hari ini: pilih task, atur energy level & niat. Di akhir hari, lakukan EOD (End of Day) review untuk refleksi.',
    actions: [
      'Pagi: buka Daily Sprint dan pilih task yang akan dikerjakan',
      'Atur energy level (1-5) dan tulis niat hari ini',
      'Centang task yang sudah selesai sepanjang hari',
      'Malam: lakukan EOD review — berapa yang selesai, refleksi',
    ],
    tips: [
      'Mulai setiap hari dengan Daily Sprint agar fokus',
      'EOD review membantu evaluasi dan perbaikan',
      'Niat yang jelas meningkatkan produktivitas',
    ],
  },
  {
    id: 'tasks',
    emoji: '✅',
    title: 'Tasks',
    category: 'core',
    description: 'Kelola semua task dengan role, prioritas, jenis pekerjaan, due date, dan proyek. Fitur lengkap untuk manajemen tugas.',
    actions: [
      'Klik "+" untuk buat task baru',
      'Atur role (CEO, Suami, Ayah, Anak, Pelajar)',
      'Set prioritas: Low, Medium, High, Urgent',
      'Pilih work type: Deep, Shallow, Admin, Meeting',
      'Tetapkan due date dan assign ke proyek',
      'Edit atau hapus task kapan saja',
    ],
    tips: [
      'Gunakan role untuk filter task per aspek kehidupan',
      'Deep work untuk task penting yang butuh fokus',
      'Gunakan task templates untuk rutinitas harian',
    ],
  },
  {
    id: 'habits',
    emoji: '🌟',
    title: 'Habits',
    category: 'core',
    description: 'Track kebiasaan harian dengan streak dan progress bulanan. Bentuk kebiasaan positif secara konsisten.',
    actions: [
      'Buat habit baru (contoh: Sholat Dhuha, Olahraga, Baca Quran)',
      'Centang setiap kali menyelesaikan habit',
      'Lihat streak (hari berturut-turut) dan progress bulanan',
      'Set streak goal untuk motivasi tambahan',
    ],
    tips: [
      'Mulai dengan 2-3 habit, tambah bertahap',
      'Streak goal membantu menjaga konsistensi',
      'Lihat heatmap bulanan untuk gambaran besar',
    ],
  },
  {
    id: 'focus',
    emoji: '⏱',
    title: 'Focus Mode',
    category: 'core',
    description: 'Pomodoro timer: 25 menit fokus → 5 menit istirahat → 15 menit long break. Sesi fokus tersimpan otomatis ke database.',
    actions: [
      'Pilih mode: Pomodoro (25m), Short Break (5m), atau Long Break (15m)',
      'Pilih task yang akan dikerjakan (opsional)',
      'Mulai timer dan fokus tanpa gangguan',
      'Saat timer selesai, pilih istirahat atau lanjut',
      'Break reminder akan muncul setelah sesi fokus',
    ],
    tips: [
      'Tautkan task saat fokus untuk tracking otomatis',
      'Ikuti siklus: 4 pomodoro → long break',
      'Break reminder menjaga kesehatan mata dan tubuh',
    ],
  },

  // Kelola Features
  {
    id: 'parkir-ide',
    emoji: '💡',
    title: 'Parkir Ide',
    category: 'kelola',
    description: 'Tangkap ide cepat sebelum hilang. Ubah menjadi task atau proyek saat waktunya tepat.',
    actions: [
      'Klik tombol FAB (bulat kanan bawah) untuk quick capture',
      'Tulis ide singkat — judul + catatan opsional',
      'Ubah ide menjadi task atau proyek kapan saja',
      'Arsipkan ide yang sudah terealisasi',
    ],
    tips: [
      'Gunakan Ctrl+Q untuk quick capture dari mana saja',
      'Ideal untuk ide spontan saat sholat atau jalan',
    ],
  },
  {
    id: 'proyek',
    emoji: '🗂',
    title: 'Proyek',
    category: 'kelola',
    description: 'Tracker proyek dengan subtask bersarang (3 level). Cocok untuk proyek kompleks dengan banyak tahapan.',
    actions: [
      'Buat proyek baru dengan nama dan deadline',
      'Tambah subtask level 1, 2, dan 3',
      'Centang subtask untuk tandai selesai',
      'Lihat progress bar untuk gambaran keseluruhan',
    ],
    tips: [
      'Break-down proyek besar menjadi subtask kecil',
      'Gunakan progress bar untuk motivasi visual',
    ],
  },
  {
    id: 'log-belajar',
    emoji: '📚',
    title: 'Log Belajar',
    category: 'kelola',
    description: 'Catat buku, podcast, video, dan artikel yang dipelajari beserta insight-nya. Jurnal belajar yang terorganisir.',
    actions: [
      'Pilih tipe: Buku, Podcast, Video, atau Artikel',
      'Masukkan judul, penulis/kreator, dan link (opsional)',
      'Tulis insight atau catatan penting',
      'Filter berdasarkan tipe atau tanggal',
    ],
    tips: [
      'Tulis insight sesegera mungkin setelah belajar',
      'Gunakan untuk referensi masa depan',
    ],
  },
  {
    id: 'reminders',
    emoji: '🔔',
    title: 'Reminders',
    category: 'kelola',
    description: 'Pengingat fleksibel: one-time, harian, mingguan, atau bulanan. Jangan lewatkan hal penting.',
    actions: [
      'Buat reminder baru dengan judul dan waktu',
      'Pilih frekuensi: Sekali, Harian, Mingguan, Bulanan',
      'Atur waktu dan tanggal pengingat',
      'Aktifkan/notifikasi sesuai kebutuhan',
    ],
    tips: [
      'Gunakan untuk tagihan, janji, atau rutinitas',
      'Reminder mingguan cocok untuk review mingguan',
    ],
  },
  {
    id: 'subscriptions',
    emoji: '💳',
    title: 'Subscriptions',
    category: 'kelola',
    description: 'Lacak langganan berulang dengan alert perpanjangan (H-7, H-3, H-1). Kontrol pengeluaran.',
    actions: [
      'Tambah subscription: nama, harga, siklus billing',
      'Atur tanggal mulai dan siklus (bulanan/tahunan)',
      'Lihat alert otomatis H-7, H-3, H-1 sebelum jatuh tempo',
      'Arsipkan yang sudah tidak aktif',
    ],
    tips: [
      'Review bulanan untuk cancel yang tidak terpakai',
      'H-7 alert memberi waktu untuk pertimbangan',
    ],
  },
  {
    id: 'laporan',
    emoji: '📊',
    title: 'Laporan',
    category: 'kelola',
    description: 'Review mingguan, tren produktivitas, dan history sprint. Data-driven decision making untuk hidup lebih baik.',
    actions: [
      'Lihat ringkasan mingguan: task selesai, habit completion, fokus',
      'Analisis tren per role dan per jenis pekerjaan',
      'Review history sprint untuk pola kerja',
      'Export atau lihat detail per periode',
    ],
    tips: [
      'Review mingguan setiap akhir pekan',
      'Gunakan data untuk set target minggu depan',
    ],
  },

  // NEW Features
  {
    id: 'recurring-tasks',
    emoji: '🔁',
    title: 'Recurring Tasks',
    category: 'baru',
    description: 'Task otomatis berulang: harian, mingguan, atau bulanan. Cocok untuk rutinitas yang sama setiap periode.',
    actions: [
      'Saat buat/edit task, aktifkan "Recurring"',
      'Pilih frekuensi: Harian, Mingguan, Bulanan',
      'Task baru akan dibuat otomatis sesuai jadwal',
      'Nonaktifkan kapan saja jika tidak relevan',
    ],
    tips: [
      'Gunakan untuk Sholat Dhuha, olahraga rutin, review mingguan',
      'Hemat waktu — tidak perlu buat task sama berulang kali',
    ],
  },
  {
    id: 'time-tracking',
    emoji: '⏱',
    title: 'Time Tracking',
    category: 'baru',
    description: 'Catat waktu aktual yang dihabiskan untuk setiap task. Bandingkan estimasi vs realita.',
    actions: [
      'Buka task → klik tombol jam untuk log waktu',
      'Masukkan durasi dalam menit atau jam',
      'Lihat total waktu per task dan per proyek',
      'Bandingkan dengan estimasi awal',
    ],
    tips: [
      'Mulai dengan task penting untuk belajar estimasi',
      'Data ini membantu perencanaan masa depan',
    ],
  },
  {
    id: 'weekly-goals',
    emoji: '🎯',
    title: 'Weekly Goals',
    category: 'baru',
    description: 'Set target per role per minggu. Fokus dan terukur — tahu persis apa yang harus dicapai.',
    actions: [
      'Buka Goals → pilih tab "Weekly Goals"',
      'Atur target untuk setiap role minggu ini',
      'Track progress sepanjang minggu',
      'Review di akhir minggu: tercapai atau tidak',
    ],
    tips: [
      'Set 1-2 goal per role agar realistis',
      'Weekly goal harus spesifik dan terukur',
    ],
  },
  {
    id: 'focus-db-sync',
    emoji: '🔄',
    title: 'Focus → DB Sync',
    category: 'baru',
    description: 'Sesi Pomodoro otomatis tersimpan ke database. Riwayat fokus lengkap untuk analisis produktivitas.',
    actions: [
      'Jalankan Focus Mode seperti biasa',
      'Setiap selesai sesi, data otomatis tersimpan',
      'Lihat history di Laporan atau Analytics',
      'Gunakan untuk evaluasi pola fokus',
    ],
    tips: [
      'Tautkan task saat fokus untuk data lebih kaya',
      'Data ini membantu temukan jam-jam produktif',
    ],
  },
  {
    id: 'task-templates',
    emoji: '📋',
    title: 'Task Templates',
    category: 'baru',
    description: 'Template task siap pakai: Rutinitas Pagi, Rutinitas Ayah, Weekly Review. Hemat waktu, konsisten.',
    actions: [
      'Saat buat task, pilih dari template',
      'Template tersedia: Rutinitas Pagi, Rutinitas Ayah, Weekly Review',
      'Task dari template langsung terisi semua field',
      'Kustomisasi setelah dibuat sesuai kebutuhan',
    ],
    tips: [
      'Gunakan template untuk rutinitas yang sama setiap hari',
      'Buat template custom untuk workflow sendiri',
    ],
  },
  {
    id: 'habit-streak-goals',
    emoji: '🔥',
    title: 'Habit Streak Goals',
    category: 'baru',
    description: 'Set target streak untuk habit — capai 7 hari, 21 hari, atau 30 hari. Celebration saat target tercapai!',
    actions: [
      'Buka Habit → edit habit → set streak goal',
      'Pilih target: 7, 14, 21, 30, atau custom hari',
      'Lihat progress menuju target',
      'Rayakan saat mencapai streak goal! 🎉',
    ],
    tips: [
      'Mulai dari target kecil (7 hari) lalu naikkan',
      'Celebration membantu motivasi jangka panjang',
    ],
  },
  {
    id: 'batch-import',
    emoji: '📥',
    title: 'Batch Import',
    category: 'baru',
    description: 'Paste banyak task sekaligus — satu per baris. Cepat dan efisien untuk input massal.',
    actions: [
      'Klik "Import" atau "Batch Add" di halaman Tasks',
      'Paste daftar task, satu per baris',
      'Sistem akan parse dan buat semua task',
      'Edit hasil import jika perlu penyesuaian',
    ],
    tips: [
      'Cocok untuk input task dari meeting atau brainstorming',
      'Format: "Judul Task" per baris',
    ],
  },
  {
    id: 'analytics',
    emoji: '📈',
    title: 'Dashboard Analytics',
    category: 'baru',
    description: 'Skor produktivitas, tren mingguan, dan breakdown per role. Gambaran data-driven tentang hidup Anda.',
    actions: [
      'Buka halaman Analytics dari menu',
      'Lihat productivity score (0-100)',
      'Analisis tren: task completion, habit rate, fokus time',
      'Breakdown per role untuk seimbangkan hidup',
    ],
    tips: [
      'Productivity score = task (40%) + focus (30%) + mood (15%) + habits (15%)',
      'Update data secara konsisten untuk hasil akurat',
    ],
  },
  {
    id: 'mood-energy',
    emoji: '😊',
    title: 'Mood & Energy Tracker',
    category: 'baru',
    description: 'Log mood dan energy setiap jam. Lihat heatmap untuk temukan jam paling produktif.',
    actions: [
      'Buka halaman Mood dari menu',
      'Log mood (1-5) dan energy level setiap jam',
      'Lihat heatmap: warna gelap = energi tinggi',
      'Analisis pola: jam mana produktif, jam mana perlu istirahat',
    ],
    tips: [
      'Log minimal 3x sehari untuk data bermakna',
      'Gunakan data untuk scheduling task penting di jam produktif',
    ],
  },
  {
    id: 'break-reminder',
    emoji: '☕',
    title: 'Break Reminder',
    category: 'baru',
    description: 'Saran istirahat otomatis setelah sesi fokus. Jaga kesehatan mata, punggung, dan produktivitas.',
    actions: [
      'Saat selesai sesi Pomodoro, banner break muncul',
      'Klik untuk mulai istirahat (Short Break atau Long Break)',
      'Tips kesehatan ditampilkan saat break',
      'Atur preferensi di Focus Mode settings',
    ],
    tips: [
      'Ikuti saran break — jangan skip untuk produktivitas jangka panjang',
      'Gunakan long break untuk stretching atau jalan kaki',
    ],
  },
  {
    id: 'quarterly-goals',
    emoji: '🏆',
    title: 'Quarterly Goals (OKR)',
    category: 'baru',
    description: 'Goal tracking OKR-style per kuartal. Objective + Key Results untuk pencapaian terstruktur.',
    actions: [
      'Buka Goals → tab "Quarterly (OKR)"',
      'Tulis Objective (tujuan besar kuartal ini)',
      'Tambah Key Results (ukuran keberhasilan)',
      'Update progress sepanjang kuartal',
      'Review di akhir kuartal: achieve atau iterate',
    ],
    tips: [
      'Set 2-3 Objective per kuartal, tidak lebih',
      'Key Results harus terukur (angka atau persentase)',
      'OKR membantu align daily task dengan tujuan besar',
    ],
  },
];

const CATEGORIES = [
  { id: 'core', label: 'Core Features', icon: '⭐' },
  { id: 'kelola', label: 'Kelola', icon: '📂' },
  { id: 'baru', label: 'NEW Features', icon: '🆕' },
] as const;

const SHORTCUTS = [
  { keys: 'Ctrl + Q', action: 'Parkir Ide — Quick capture ide baru' },
  { keys: 'Ctrl + Shift + F', action: 'Pencarian — Buka halaman search' },
  { keys: 'Alt + 1-8', action: 'Navigasi — Lompat ke halaman utama' },
  { keys: 'Ctrl + Enter', action: 'Simpan — Submit form apapun' },
];

const TIPS = [
  { emoji: '🌅', text: 'Mulai setiap hari dengan Daily Sprint — rencanakan & niatkan harimu' },
  { emoji: '🌙', text: 'Akhiri hari dengan EOD Review — refleksi & evaluasi' },
  { emoji: '🔥', text: 'Set habit streak goals untuk motivasi — target 21 hari' },
  { emoji: '😊', text: 'Gunakan Mood Tracker untuk temukan jam paling produktif' },
  { emoji: '📥', text: 'Batch import untuk input task cepat dari meeting' },
  { emoji: '🔁', text: 'Recurring tasks untuk rutinitas — hemat waktu' },
  { emoji: '🎯', text: 'Weekly Goals menjaga fokus per role' },
  { emoji: '☕', text: 'Jangan skip break reminder — kesehatan > produktivitas' },
];

// ─── Collapsible Feature Card ─────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: Feature }) {
  const [open, setOpen] = useState(false);

  const categoryBadge = feature.category === 'core'
    ? { variant: 'default' as const, label: 'Core' }
    : feature.category === 'kelola'
      ? { variant: 'purple' as const, label: 'Kelola' }
      : { variant: 'success' as const, label: 'NEW' };

  return (
    <Card className="transition-all duration-200 hover:border-slate-600">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 sm:p-5 flex items-center gap-3"
      >
        <span className="text-2xl sm:text-3xl flex-shrink-0">{feature.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-white">{feature.title}</h3>
            <Badge variant={categoryBadge.variant}>{categoryBadge.label}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-1">{feature.description}</p>
        </div>
        <span className={`text-slate-500 text-lg transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-slate-700/50 pt-4 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-slate-300">{feature.description}</p>

          {/* Key Actions */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cara Menggunakan</h4>
            <ul className="space-y-1.5">
              {feature.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          {feature.tips && feature.tips.length > 0 && (
            <div className="bg-slate-700/30 rounded-xl p-3">
              <h4 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">💡 Tips</h4>
              <ul className="space-y-1.5">
                {feature.tips.map((tip, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-amber-400/60 flex-shrink-0">✦</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PanduanPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedAll, setExpandedAll] = useState(false);

  const filtered = useMemo(() => {
    let result = FEATURES;
    if (activeCategory !== 'all') {
      result = result.filter(f => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.actions.some(a => a.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory]);

  const coreCount = FEATURES.filter(f => f.category === 'core').length;
  const kelolaCount = FEATURES.filter(f => f.category === 'kelola').length;
  const newCount = FEATURES.filter(f => f.category === 'baru').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span>📖</span>
            <span>Panduan Hidup Produktif Berkah</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Panduan lengkap untuk semua fitur aplikasi. Temukan cara memaksimalkan produktivitas,
            membangun kebiasaan baik, dan menjalani hidup yang lebih terstruktur & berkah.
          </p>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="px-4 pb-3 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Input
            placeholder="🔍  Cari fitur... (contoh: habit, pomodoro, import)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category Filter ────────────────────────────────────────── */}
      <div className="px-4 pb-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Semua ({FEATURES.length})
          </button>
          <button
            onClick={() => setActiveCategory('core')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'core'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ⭐ Core ({coreCount})
          </button>
          <button
            onClick={() => setActiveCategory('kelola')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'kelola'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📂 Kelola ({kelolaCount})
          </button>
          <button
            onClick={() => setActiveCategory('baru')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'baru'
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            🆕 NEW ({newCount})
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── Quick Start ───────────────────────────────────────────── */}
        <section id="quickstart">
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🚀</span> Quick Start
          </h2>
          <Card>
            <CardContent className="space-y-0">
              {[
                {
                  step: 1,
                  emoji: '👤',
                  title: 'Daftar & Login',
                  desc: 'Buat akun baru atau login. Atur role hidupmu: CEO, Suami, Ayah, Anak, Pelajar.',
                },
                {
                  step: 2,
                  emoji: '📝',
                  title: 'Buat Task Pertama',
                  desc: 'Buka halaman Tasks, buat task dengan role & prioritas. Gunakan batch import untuk input cepat.',
                },
                {
                  step: 3,
                  emoji: '🎯',
                  title: 'Mulai Daily Sprint',
                  desc: 'Setiap pagi: pilih task, atur niat. Setiap malam: lakukan EOD review. Konsisten = hasil!',
                },
              ].map((s, i) => (
                <div key={s.step} className={`flex items-start gap-3 py-4 ${i > 0 ? 'border-t border-slate-700/50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>{s.emoji}</span>
                      <span>{s.title}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* ── Quick Nav ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🧭</span> Navigasi Cepat
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              { emoji: '🏠', label: 'Beranda', href: '/' },
              { emoji: '🎯', label: 'Sprint', href: '/sprint' },
              { emoji: '✅', label: 'Tasks', href: '/tasks' },
              { emoji: '🌟', label: 'Habits', href: '/habits' },
              { emoji: '⏱', label: 'Focus', href: '/focus' },
              { emoji: '💡', label: 'Ide', href: '/ideas' },
              { emoji: '📊', label: 'Laporan', href: '/laporan' },
              { emoji: '📈', label: 'Analytics', href: '/analytics' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-center"
              >
                <span className="text-lg sm:text-xl">{item.emoji}</span>
                <span className="text-[10px] sm:text-xs text-slate-400">{item.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Feature Sections ──────────────────────────────────────── */}
        {CATEGORIES.map(cat => {
          const catFeatures = filtered.filter(f => f.category === cat.id);
          if (catFeatures.length === 0) return null;

          return (
            <section key={cat.id} id={`cat-${cat.id}`}>
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <Badge variant={cat.id === 'core' ? 'default' : cat.id === 'kelola' ? 'purple' : 'success'}>
                  {catFeatures.length}
                </Badge>
              </h2>
              <div className="space-y-2">
                {catFeatures.map(f => (
                  <FeatureCard key={f.id} feature={f} />
                ))}
              </div>
            </section>
          );
        })}

        {/* No results */}
        {filtered.length === 0 && (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <span className="text-4xl">🔍</span>
                <p className="text-slate-400 mt-3 text-sm">
                  Tidak ditemukan fitur untuk &quot;{search}&quot;. Coba kata kunci lain.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Keyboard Shortcuts ────────────────────────────────────── */}
        <section id="shortcuts">
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>⌨️</span>
            <span>Keyboard Shortcuts</span>
          </h2>
          <Card>
            <CardContent className="space-y-0">
              {SHORTCUTS.map((s, i) => (
                <div
                  key={s.keys}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-700/50' : ''}`}
                >
                  <kbd className="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-xs font-mono whitespace-nowrap border border-slate-600">
                    {s.keys}
                  </kbd>
                  <span className="text-sm text-slate-400">{s.action}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* ── Tips ──────────────────────────────────────────────────── */}
        <section id="tips">
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>Tips & Best Practices</span>
          </h2>
          <Card>
            <CardContent>
              <div className="space-y-3">
                {TIPS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{tip.emoji}</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{tip.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Roles Reference ───────────────────────────────────────── */}
        <section id="roles">
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🎭</span>
            <span>Roles (Peran Hidup)</span>
          </h2>
          <Card>
            <CardContent>
              <p className="text-sm text-slate-400 mb-4">
                Setiap task, habit, dan goal bisa di-assign ke role. Ini membantu menjaga keseimbangan hidup.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { emoji: '👔', name: 'CEO', desc: 'Pekerjaan & karir' },
                  { emoji: '💑', name: 'Suami', desc: 'Pasangan & keluarga' },
                  { emoji: '👨‍👧', name: 'Ayah', desc: 'Anak & parenting' },
                  { emoji: '🏠', name: 'Anak', desc: 'Orang tua & keluarga' },
                  { emoji: '📖', name: 'Pelajar', desc: 'Belajar & pengembangan' },
                ].map(role => (
                  <div key={role.name} className="text-center p-3 rounded-xl bg-slate-700/30 border border-slate-700/50">
                    <span className="text-2xl">{role.emoji}</span>
                    <p className="text-xs font-semibold text-white mt-1">{role.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{role.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── About ─────────────────────────────────────────────────── */}
        <section className="pb-8">
          <Card className="border-slate-700/30">
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-lg">🤲</p>
                <p className="text-sm text-slate-400 italic leading-relaxed">
                  &quot;Sesungguhnya Allah tidak mengubah keadaan suatu kaum sehingga mereka mengubah keadaan yang ada pada diri mereka sendiri.&quot;
                </p>
                <p className="text-xs text-slate-500">— QS. Ar-Ra&apos;d: 11</p>
                <p className="text-xs text-slate-500 mt-3">
                  Hidup Produktif Berkah v2.0 — Dibuat dengan ❤️ di Cimahi
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
