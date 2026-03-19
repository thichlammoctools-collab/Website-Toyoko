import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quang Phú – Nhà nhập khẩu máy cầm tay Toyoko',
  description: 'Quang Phú chuyên nhập khẩu và phân phối máy cầm tay điện thương hiệu Toyoko chính hãng tại Việt Nam. Máy khoan, máy mài, máy cưa và nhiều loại máy công cụ khác.',
  keywords: 'Toyoko, máy cầm tay, máy khoan, máy mài, máy cưa, Quang Phú',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
