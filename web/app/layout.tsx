import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vibe English — Tự do học, tự tin nói",
    template: "%s · Vibe English",
  },
  description:
    "Nền tảng học tiếng Anh cá nhân hoá dựa trên AI. Học từ video thực tế, AI chấm & điều chỉnh lộ trình theo bạn.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
