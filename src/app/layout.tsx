import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FIFA World Cup 2026 - Fixture & Results',
  description: '2026 FIFA World Cup fixtures, results, and notifications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen bg-gradient-to-br from-fifa-dark via-gray-900 to-fifa-blue/20`}>
        {children}
      </body>
    </html>
  );
}
