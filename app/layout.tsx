import type { Metadata } from 'next';
import './globals.css';
import { Layout } from '@/components/layout/Layout';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Hidup Produktif Berkah',
  description: 'Dashboard produktivitas personal — kelola waktu & pikiran',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-slate-950 text-white antialiased">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
