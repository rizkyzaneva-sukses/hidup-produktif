import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfWeek, subDays, isToday, isPast, isFuture, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function yesterdayStr(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

export function weekStartStr(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function formatDateId(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, d MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatRupiah(nominal: number): string {
  return 'Rp ' + nominal.toLocaleString('id-ID');
}

export function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    return isPast(date) && !isToday(date);
  } catch { return false; }
}

export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr === todayStr();
}

export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    return isFuture(parseISO(dateStr)) && !isToday(parseISO(dateStr));
  } catch { return false; }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Selamat Subuh';
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export function getDailyQuote(quotes: string[]): string {
  const day = new Date().getDate();
  return quotes[day % quotes.length];
}
