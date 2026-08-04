export interface SurahInfo {
  nomor: number;
  nama: string;
  namaArab: string;
  arti: string;
  halamanAwal: number;
  ayat: number;
}

export const SURAH_LIST: SurahInfo[] = [
  { nomor: 1, nama: "Al-Fatihah", namaArab: "الفاتحة", arti: "Pembukaan", halamanAwal: 1, ayat: 7 },
  { nomor: 2, nama: "Al-Baqarah", namaArab: "البقرة", arti: "Sapi Betina", halamanAwal: 2, ayat: 286 },
  { nomor: 3, nama: "Ali 'Imran", namaArab: "آل عمران", arti: "Keluarga Imran", halamanAwal: 50, ayat: 200 },
  { nomor: 4, nama: "An-Nisa'", namaArab: "النساء", arti: "Wanita", halamanAwal: 77, ayat: 176 },
  { nomor: 5, nama: "Al-Ma'idah", namaArab: "المائدة", arti: "Hidangan", halamanAwal: 106, ayat: 120 },
  { nomor: 6, nama: "Al-An'am", namaArab: "الأنعام", arti: "Binatang Ternak", halamanAwal: 128, ayat: 165 },
  { nomor: 7, nama: "Al-A'raf", namaArab: "الأعراف", arti: "Tempat Tertinggi", halamanAwal: 151, ayat: 206 },
  { nomor: 8, nama: "Al-Anfal", namaArab: "الأنفال", arti: "Harta Rampasan Perang", halamanAwal: 177, ayat: 75 },
  { nomor: 9, nama: "At-Taubah", namaArab: "التوبة", arti: "Pengampunan", halamanAwal: 187, ayat: 129 },
  { nomor: 10, nama: "Yunus", namaArab: "يونس", arti: "Nabi Yunus", halamanAwal: 208, ayat: 109 },
  { nomor: 11, nama: "Hud", namaArab: "هود", arti: "Nabi Hud", halamanAwal: 221, ayat: 123 },
  { nomor: 12, nama: "Yusuf", namaArab: "يوسف", arti: "Nabi Yusuf", halamanAwal: 235, ayat: 111 },
  { nomor: 13, nama: "Ar-Ra'd", namaArab: "الرعد", arti: "Guruh", halamanAwal: 249, ayat: 43 },
  { nomor: 14, nama: "Ibrahim", namaArab: "إبراهيم", arti: "Nabi Ibrahim", halamanAwal: 255, ayat: 52 },
  { nomor: 15, nama: "Al-Hijr", namaArab: "الحجر", arti: "Negeri Hijr", halamanAwal: 262, ayat: 99 },
  { nomor: 16, nama: "An-Nahl", namaArab: "النحل", arti: "Lebah", halamanAwal: 267, ayat: 128 },
  { nomor: 17, nama: "Al-Isra'", namaArab: "الإسراء", arti: "Perjalanan Malam", halamanAwal: 282, ayat: 111 },
  { nomor: 18, nama: "Al-Kahf", namaArab: "الكهف", arti: "Gua", halamanAwal: 293, ayat: 110 },
  { nomor: 19, nama: "Maryam", namaArab: "مريم", arti: "Maryam", halamanAwal: 305, ayat: 98 },
  { nomor: 20, nama: "Ta Ha", namaArab: "طه", arti: "Ta Ha", halamanAwal: 312, ayat: 135 },
  { nomor: 21, nama: "Al-Anbiya'", namaArab: "الأنبياء", arti: "Para Nabi", halamanAwal: 322, ayat: 112 },
  { nomor: 22, nama: "Al-Hajj", namaArab: "الحج", arti: "Haji", halamanAwal: 332, ayat: 78 },
  { nomor: 23, nama: "Al-Mu'minun", namaArab: "المؤمنون", arti: "Orang-Orang Mukmin", halamanAwal: 342, ayat: 118 },
  { nomor: 24, nama: "An-Nur", namaArab: "النور", arti: "Cahaya", halamanAwal: 350, ayat: 64 },
  { nomor: 25, nama: "Al-Furqan", namaArab: "الفرقان", arti: "Pembeda", halamanAwal: 359, ayat: 77 },
  { nomor: 26, nama: "Asy-Syu'ara'", namaArab: "الشعراء", arti: "Para Penyair", halamanAwal: 367, ayat: 227 },
  { nomor: 27, nama: "An-Naml", namaArab: "النمل", arti: "Semut", halamanAwal: 377, ayat: 93 },
  { nomor: 28, nama: "Al-Qasas", namaArab: "القصص", arti: "Cerita", halamanAwal: 385, ayat: 88 },
  { nomor: 29, nama: "Al-'Ankabut", namaArab: "العنكبوت", arti: "Laba-Laba", halamanAwal: 396, ayat: 69 },
  { nomor: 30, nama: "Ar-Rum", namaArab: "الروم", arti: "Romawi", halamanAwal: 404, ayat: 60 },
  { nomor: 31, nama: "Luqman", namaArab: "لقمان", arti: "Luqman", halamanAwal: 411, ayat: 34 },
  { nomor: 32, nama: "As-Sajdah", namaArab: "السجدة", arti: "Sujud", halamanAwal: 415, ayat: 30 },
  { nomor: 33, nama: "Al-Ahzab", namaArab: "الأحزاب", arti: "Golongan Bersekutu", halamanAwal: 418, ayat: 73 },
  { nomor: 34, nama: "Saba'", namaArab: "سبأ", arti: "Kaum Saba'", halamanAwal: 428, ayat: 54 },
  { nomor: 35, nama: "Fatir", namaArab: "فاطر", arti: "Pencipta", halamanAwal: 434, ayat: 45 },
  { nomor: 36, nama: "Ya Sin", namaArab: "يس", arti: "Ya Sin", halamanAwal: 440, ayat: 83 },
  { nomor: 37, nama: "As-Saffat", namaArab: "الصافات", arti: "Yang Bersaf-Saf", halamanAwal: 446, ayat: 182 },
  { nomor: 38, nama: "Sad", namaArab: "ص", arti: "Sad", halamanAwal: 453, ayat: 88 },
  { nomor: 39, nama: "Az-Zumar", namaArab: "الزمر", arti: "Rombongan", halamanAwal: 458, ayat: 75 },
  { nomor: 40, nama: "Gafir", namaArab: "غافر", arti: "Yang Mengampuni", halamanAwal: 467, ayat: 85 },
  { nomor: 41, nama: "Fussilat", namaArab: "فصلت", arti: "Yang Dijelaskan", halamanAwal: 477, ayat: 54 },
  { nomor: 42, nama: "Asy-Syura", namaArab: "الشورى", arti: "Musyawarah", halamanAwal: 483, ayat: 53 },
  { nomor: 43, nama: "Az-Zukhruf", namaArab: "الزخرف", arti: "Perhiasan", halamanAwal: 489, ayat: 89 },
  { nomor: 44, nama: "Ad-Dukhan", namaArab: "الدخان", arti: "Kabut", halamanAwal: 496, ayat: 59 },
  { nomor: 45, nama: "Al-Jasiyah", namaArab: "الجاثية", arti: "Yang Berlutut", halamanAwal: 499, ayat: 37 },
  { nomor: 46, nama: "Al-Ahqaf", namaArab: "الأحقاف", arti: "Bukit Pasir", halamanAwal: 502, ayat: 35 },
  { nomor: 47, nama: "Muhammad", namaArab: "محمد", arti: "Nabi Muhammad", halamanAwal: 507, ayat: 38 },
  { nomor: 48, nama: "Al-Fath", namaArab: "الفتح", arti: "Kemenangan", halamanAwal: 511, ayat: 29 },
  { nomor: 49, nama: "Al-Hujurat", namaArab: "الحجرات", arti: "Kamar-Kamar", halamanAwal: 515, ayat: 18 },
  { nomor: 50, nama: "Qaf", namaArab: "ق", arti: "Qaf", halamanAwal: 518, ayat: 45 },
  { nomor: 51, nama: "Az-Zariyat", namaArab: "الذاريات", arti: "Angin Yang Menerbangkan", halamanAwal: 520, ayat: 60 },
  { nomor: 52, nama: "At-Tur", namaArab: "الطور", arti: "Bukit", halamanAwal: 523, ayat: 49 },
  { nomor: 53, nama: "An-Najm", namaArab: "النجم", arti: "Bintang", halamanAwal: 526, ayat: 62 },
  { nomor: 54, nama: "Al-Qamar", namaArab: "القمر", arti: "Bulan", halamanAwal: 528, ayat: 55 },
  { nomor: 55, nama: "Ar-Rahman", namaArab: "الرحمن", arti: "Yang Maha Pemurah", halamanAwal: 531, ayat: 78 },
  { nomor: 56, nama: "Al-Waqi'ah", namaArab: "الواقعة", arti: "Hari Kiamat", halamanAwal: 534, ayat: 96 },
  { nomor: 57, nama: "Al-Hadid", namaArab: "الحديد", arti: "Besi", halamanAwal: 537, ayat: 29 },
  { nomor: 58, nama: "Al-Mujadilah", namaArab: "المجادلة", arti: "Wanita yang Menggugat", halamanAwal: 542, ayat: 22 },
  { nomor: 59, nama: "Al-Hasyr", namaArab: "الحشر", arti: "Pengusiran", halamanAwal: 545, ayat: 24 },
  { nomor: 60, nama: "Al-Mumtahanah", namaArab: "الممتحنة", arti: "Wanita Yang Diuji", halamanAwal: 549, ayat: 13 },
  { nomor: 61, nama: "As-Saff", namaArab: "الصف", arti: "Barisan", halamanAwal: 551, ayat: 14 },
  { nomor: 62, nama: "Al-Jumu'ah", namaArab: "الجمعة", arti: "Hari Jum'at", halamanAwal: 553, ayat: 11 },
  { nomor: 63, nama: "Al-Munafiqun", namaArab: "المنافقون", arti: "Orang Munafik", halamanAwal: 554, ayat: 11 },
  { nomor: 64, nama: "At-Tagabun", namaArab: "التغابن", arti: "Hari Ditampakkan Kesalahan", halamanAwal: 556, ayat: 18 },
  { nomor: 65, nama: "At-Talaq", namaArab: "الطلاق", arti: "Talak", halamanAwal: 558, ayat: 12 },
  { nomor: 66, nama: "At-Tahrim", namaArab: "التحريم", arti: "Pengharaman", halamanAwal: 560, ayat: 12 },
  { nomor: 67, nama: "Al-Mulk", namaArab: "الملك", arti: "Kerajaan", halamanAwal: 562, ayat: 30 },
  { nomor: 68, nama: "Al-Qalam", namaArab: "القلم", arti: "Pena", halamanAwal: 564, ayat: 52 },
  { nomor: 69, nama: "Al-Haqqah", namaArab: "الحاقة", arti: "Kiamat Yang Pasti", halamanAwal: 566, ayat: 52 },
  { nomor: 70, nama: "Al-Ma'arij", namaArab: "المعارج", arti: "Tempat Naik", halamanAwal: 568, ayat: 44 },
  { nomor: 71, nama: "Nuh", namaArab: "نوح", arti: "Nabi Nuh", halamanAwal: 570, ayat: 28 },
  { nomor: 72, nama: "Al-Jinn", namaArab: "الجن", arti: "Jin", halamanAwal: 572, ayat: 28 },
  { nomor: 73, nama: "Al-Muzzammil", namaArab: "المزمل", arti: "Orang Berselimut", halamanAwal: 574, ayat: 20 },
  { nomor: 74, nama: "Al-Muddassir", namaArab: "المدثر", arti: "Orang Berkemul", halamanAwal: 575, ayat: 56 },
  { nomor: 75, nama: "Al-Qiyamah", namaArab: "القيامة", arti: "Hari Kiamat", halamanAwal: 577, ayat: 40 },
  { nomor: 76, nama: "Al-Insan", namaArab: "الإنسان", arti: "Manusia", halamanAwal: 578, ayat: 31 },
  { nomor: 77, nama: "Al-Mursalat", namaArab: "المرسلات", arti: "Malaikat Yang Diutus", halamanAwal: 580, ayat: 50 },
  { nomor: 78, nama: "An-Naba'", namaArab: "النبأ", arti: "Berita Besar", halamanAwal: 582, ayat: 40 },
  { nomor: 79, nama: "An-Nazi'at", namaArab: "النازعات", arti: "Malaikat Pencabut", halamanAwal: 583, ayat: 46 },
  { nomor: 80, nama: "'Abasa", namaArab: "عبس", arti: "Ia Bermuka Masam", halamanAwal: 585, ayat: 42 },
  { nomor: 81, nama: "At-Takwir", namaArab: "التكوير", arti: "Menggulung", halamanAwal: 586, ayat: 29 },
  { nomor: 82, nama: "Al-Infitar", namaArab: "الإنفطار", arti: "Terbelah", halamanAwal: 587, ayat: 19 },
  { nomor: 83, nama: "Al-Mutaffifin", namaArab: "المطففين", arti: "Orang Curang", halamanAwal: 587, ayat: 36 },
  { nomor: 84, nama: "Al-Insyiqaq", namaArab: "الإنشقاق", arti: "Terbelah", halamanAwal: 589, ayat: 25 },
  { nomor: 85, nama: "Al-Buruj", namaArab: "البروج", arti: "Gugusan Bintang", halamanAwal: 590, ayat: 22 },
  { nomor: 86, nama: "At-Tariq", namaArab: "الطارق", arti: "Yang Datang Malam", halamanAwal: 591, ayat: 17 },
  { nomor: 87, nama: "Al-A'la", namaArab: "الأعلى", arti: "Yang Paling Tinggi", halamanAwal: 591, ayat: 19 },
  { nomor: 88, nama: "Al-Gasyiyah", namaArab: "الغاشية", arti: "Hari Pembalasan", halamanAwal: 592, ayat: 26 },
  { nomor: 89, nama: "Al-Fajr", namaArab: "الفجر", arti: "Fajar", halamanAwal: 593, ayat: 30 },
  { nomor: 90, nama: "Al-Balad", namaArab: "البلد", arti: "Negeri", halamanAwal: 594, ayat: 20 },
  { nomor: 91, nama: "Asy-Syams", namaArab: "الشمس", arti: "Matahari", halamanAwal: 595, ayat: 15 },
  { nomor: 92, nama: "Al-Lail", namaArab: "الليل", arti: "Malam", halamanAwal: 595, ayat: 21 },
  { nomor: 93, nama: "Ad-Duha", namaArab: "الضحى", arti: "Waktu Dhuha", halamanAwal: 596, ayat: 11 },
  { nomor: 94, nama: "Asy-Syarh", namaArab: "الشرح", arti: "Melapangkan", halamanAwal: 596, ayat: 8 },
  { nomor: 95, nama: "At-Tin", namaArab: "التين", arti: "Buah Tin", halamanAwal: 597, ayat: 8 },
  { nomor: 96, nama: "Al-'Alaq", namaArab: "العلق", arti: "Segumpal Darah", halamanAwal: 597, ayat: 19 },
  { nomor: 97, nama: "Al-Qadr", namaArab: "القدر", arti: "Kemuliaan", halamanAwal: 598, ayat: 5 },
  { nomor: 98, nama: "Al-Bayyinah", namaArab: "البينة", arti: "Bukti Nyata", halamanAwal: 598, ayat: 8 },
  { nomor: 99, nama: "Az-Zalzalah", namaArab: "الزلزلة", arti: "Kegoncangan", halamanAwal: 599, ayat: 8 },
  { nomor: 100, nama: "Al-'Adiyat", namaArab: "العاديات", arti: "Kuda Perang", halamanAwal: 599, ayat: 11 },
  { nomor: 101, nama: "Al-Qari'ah", namaArab: "القارعة", arti: "Hari Kiamat", halamanAwal: 600, ayat: 11 },
  { nomor: 102, nama: "At-Takasur", namaArab: "التكاثر", arti: "Bermegah-Megahan", halamanAwal: 600, ayat: 8 },
  { nomor: 103, nama: "Al-'Asr", namaArab: "العصر", arti: "Masa", halamanAwal: 601, ayat: 3 },
  { nomor: 104, nama: "Al-Humazah", namaArab: "الهمزة", arti: "Pengumpat", halamanAwal: 601, ayat: 9 },
  { nomor: 105, nama: "Al-Fil", namaArab: "الفيل", arti: "Gajah", halamanAwal: 601, ayat: 5 },
  { nomor: 106, nama: "Quraisy", namaArab: "قريش", arti: "Suku Quraisy", halamanAwal: 602, ayat: 4 },
  { nomor: 107, nama: "Al-Ma'un", namaArab: "الماعون", arti: "Barang Berguna", halamanAwal: 602, ayat: 7 },
  { nomor: 108, nama: "Al-Kausar", namaArab: "الكوثر", arti: "Nikmat Berlimpah", halamanAwal: 602, ayat: 3 },
  { nomor: 109, nama: "Al-Kafirun", namaArab: "الكافرون", arti: "Orang Kafir", halamanAwal: 603, ayat: 6 },
  { nomor: 110, nama: "An-Nasr", namaArab: "النصر", arti: "Pertolongan", halamanAwal: 603, ayat: 3 },
  { nomor: 111, nama: "Al-Lahab", namaArab: "المسد", arti: "Gejolak Api", halamanAwal: 603, ayat: 5 },
  { nomor: 112, nama: "Al-Ikhlas", namaArab: "الإخلاص", arti: "Ikhlas", halamanAwal: 604, ayat: 4 },
  { nomor: 113, nama: "Al-Falaq", namaArab: "الفلق", arti: "Waktu Subuh", halamanAwal: 604, ayat: 5 },
  { nomor: 114, nama: "An-Nas", namaArab: "الناس", arti: "Manusia", halamanAwal: 604, ayat: 6 },
];

export function findSurah(nama: string): SurahInfo | undefined {
  const n = nama.toLowerCase().trim();
  return SURAH_LIST.find(s =>
    s.nama.toLowerCase() === n ||
    s.nama.toLowerCase().replace(/['']/g, '') === n ||
    n.includes(s.nama.toLowerCase()) ||
    String(s.nomor) === n
  );
}

export function getHalaman(surah: string, ayat: number): number | null {
  const s = findSurah(surah);
  if (!s) return null;
  return s.halamanAwal + Math.floor((ayat - 1) / 20);
}

export function searchSurah(query: string): SurahInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return SURAH_LIST;
  return SURAH_LIST.filter(s =>
    s.nama.toLowerCase().includes(q) ||
    s.namaArab.includes(q) ||
    s.arti.toLowerCase().includes(q) ||
    String(s.nomor) === q
  );
}
