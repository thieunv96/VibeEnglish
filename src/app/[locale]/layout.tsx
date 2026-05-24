import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import "../globals.css";

import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeartbeatPing } from "@/components/HeartbeatPing";
import { auth } from "@/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeEnglish — Learn freely, speak confidently",
  description:
    "Learn English with 1,745+ free audio and video lessons. Listening, dictation, grammar, vocabulary — A1 to C2.",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/favicon.svg",
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

  const session = await auth();
  const sessionUser = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  const isLearner = Boolean(sessionUser?.id) && !sessionUser?.isAdmin;

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider>
          <SessionProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            {isLearner && <HeartbeatPing />}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
              toastOptions={{ classNames: { toast: "font-sans" } }}
            />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
