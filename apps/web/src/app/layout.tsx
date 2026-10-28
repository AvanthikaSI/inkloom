import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Inkloom AI — Enterprise Brand-Governance Platform',
  description: 'Multi-modal brand compliance, explainable diagnostics, and human-in-the-loop review.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0e1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body
        className={`${inter.className} min-h-screen text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-white`}
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.12), transparent), ' +
            'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(139, 92, 246, 0.06), transparent), ' +
            'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(59, 130, 246, 0.05), transparent), ' +
            'linear-gradient(to bottom, #07090f 0%, #0a0e1a 30%, #0c1022 70%, #080c18 100%)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
