import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import "../globals.css";

import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeEnglish — Learn freely, speak confidently",
  description:
    "Learn English with 1,745+ free audio and video lessons. Listening, dictation, grammar, vocabulary — A1 to C2.",
  icons: {
    icon: "/brand/logo.png",
    shortcut: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider>
          <SessionProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
