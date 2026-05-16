import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vibe English — Tự do học, tự tin nói",
    template: "%s · Vibe English",
  },
  description:
    "Nền tảng học tiếng Anh cá nhân hoá dựa trên AI. Học từ video thực tế, AI chấm & điều chỉnh lộ trình theo bạn.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={sourceSans.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
