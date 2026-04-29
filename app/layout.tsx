import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "행운의 숫자 | 다상담",
  description: "나만의 행운의 로또 번호를 뽑아보세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
