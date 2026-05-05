export const ROLES = ['CEO', 'Suami', 'Ayah', 'Anak', 'Pelajar'];

export const ROLE_CONFIG: Record<string, { color: string; bg: string; text: string; border: string; bgSoft: string; emoji: string }> = {
  CEO:     { color: 'blue',   bg: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500/30',   bgSoft: 'bg-blue-500/10',   emoji: '💼' },
  Suami:   { color: 'pink',   bg: 'bg-pink-500',   text: 'text-pink-400',   border: 'border-pink-500/30',   bgSoft: 'bg-pink-500/10',   emoji: '💑' },
  Ayah:    { color: 'green',  bg: 'bg-green-500',  text: 'text-green-400',  border: 'border-green-500/30',  bgSoft: 'bg-green-500/10',  emoji: '👨‍👧‍👦' },
  Anak:    { color: 'purple', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', bgSoft: 'bg-purple-500/10', emoji: '🤲' },
  Pelajar: { color: 'amber',  bg: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-500/30',  bgSoft: 'bg-amber-500/10',  emoji: '📚' },
  Umum:    { color: 'slate',  bg: 'bg-slate-500',  text: 'text-slate-400',  border: 'border-slate-500/30',  bgSoft: 'bg-slate-500/10',  emoji: '📌' },
};

export const PRIORITIES = ['Tinggi', 'Sedang', 'Rendah'];
export const WORK_TYPES = ['Deep Work', 'Admin', 'Shallow'];
export const IDEA_CATEGORIES = ['Bisnis', 'Produk', 'Maulana Farm', 'Keuangan', 'Personal', 'Random'];
export const IDEA_STATUSES = ['Mentah', 'Diproses', 'Dieksekusi'];
export const FREQUENCIES = ['Sekali', 'Harian', 'Mingguan', 'Bulanan'];
export const LEARNING_TYPES = ['Buku', 'Podcast', 'Video', 'Artikel'];
export const PROJECT_STATUSES = ['Aktif', 'Selesai', 'Ditunda'];
export const SUB_CATEGORIES = ['Software', 'Ecourse'];

export const DEFAULT_HABITS = [
  { label: 'Sholat 5 Waktu', emoji: '🕌', pinned: true, sort_order: 0 },
  { label: 'Olahraga 30 mnt', emoji: '💪', pinned: false, sort_order: 1 },
  { label: 'Baca 10 halaman', emoji: '📖', pinned: false, sort_order: 2 },
  { label: 'Pesan ke Istri', emoji: '💌', pinned: false, sort_order: 3 },
  { label: 'Minum 8 gelas air', emoji: '💧', pinned: false, sort_order: 4 },
  { label: 'Tidur sebelum 23:00', emoji: '🛏️', pinned: false, sort_order: 5 },
];

export const QUOTES = [
  'Barakallahu laka fi waqtik — Semoga Allah berkahi waktumu.',
  'Manusia yang paling baik adalah yang paling bermanfaat bagi orang lain.',
  'Mulai dari yang kecil, mulai dari sekarang, mulai dari diri sendiri.',
  'Jangan tunda sampai besok apa yang bisa dikerjakan hari ini.',
  'Setiap pagi adalah kesempatan baru untuk menjadi versi terbaik dirimu.',
  'Kerja keras tanpa doa adalah sombong. Doa tanpa kerja keras adalah sia-sia.',
  'Disiplin adalah jembatan antara tujuan dan pencapaian.',
  'Produktivitas sejati bukan tentang sibuk, tapi tentang hasil yang bermakna.',
  'Barang siapa bersungguh-sungguh, pasti akan berhasil.',
  'Niatkan setiap pekerjaanmu sebagai ibadah, maka hidupmu akan penuh berkah.',
  'Fokus pada yang bisa kamu kendalikan, serahkan sisanya kepada Allah.',
  'Istiqomah itu lebih baik dari sekedar karomah.',
  'Waktu adalah modal utama — jangan habiskan untuk hal yang tidak bernilai.',
  'Setiap malam sebelum tidur, tanyakan: apa yang sudah aku berikan hari ini?',
  'Sukses dunia akhirat dimulai dari pengelolaan waktu yang baik.',
];

export const PRIORITY_COLORS: Record<string, string> = {
  Tinggi: 'text-red-400',
  Sedang: 'text-yellow-400',
  Rendah: 'text-green-400',
};

export const WORK_TYPE_COLORS: Record<string, string> = {
  'Deep Work': 'bg-red-500/20 text-red-300',
  Admin: 'bg-yellow-500/20 text-yellow-300',
  Shallow: 'bg-green-500/20 text-green-300',
};

export const DURATION_OPTIONS = ['30 menit', '1 jam', '1,5 jam', '2 jam'];
export const DURATION_HOURS: Record<string, number> = {
  '30 menit': 0.5,
  '1 jam': 1,
  '1,5 jam': 1.5,
  '2 jam': 2,
};

// Sholat times for Cimahi (approximate, static)
export const SHOLAT_TIMES = {
  Subuh: '04:25',
  Dzuhur: '12:00',
  Ashar: '15:15',
  Maghrib: '18:00',
  Isya: '19:15',
};
