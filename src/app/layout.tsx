import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Rejestracja Hiszpania - Przerój pojazdów w Hiszpanii',
  description: 'Kompletna obsługa przerejestrowania samochodu w Hiszpanii. Dokumenty, rejestracja, pomoc prawna. Załatwimy wszystko za Ciebie.',
  keywords: 'rejestracja samochodu, zmiana rejestracji, samochody w Hiszpanii, dokumenty pojazdów, okręgowy urząd przeznaczeń pojazdów',
  authors: [{ name: 'Polska Grupa Konsultingowa S.L.' }],
  openGraph: {
    title: 'Rejestracja Hiszpania - Rejestracja pojazdów',
    description: 'Profesjonalna pomoc w rejestracji pojazdów w Hiszpanii. Załatwimy wszystkie formalności.',
    url: 'https://rejestracjahiszpania.com',
    siteName: 'RejestracjaHiszpania.com',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rejestracja Hiszpania - Rejestracja pojazdów',
    description: 'Profesjonalna pomoc w rejestracji pojazdów w Hiszpanii.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-8XH8EQLTXY"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-8XH8EQLTXY');
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
