import type { Metadata } from 'next'
import { Roboto, Roboto_Condensed } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-roboto-condensed',
  weight: ['400', '700', '900'],
})

export const metadata: Metadata = {
  title: 'Quang Phú – Nhà nhập khẩu máy cầm tay Toyoko',
  description: 'Quang Phú chuyên nhập khẩu và phân phối máy cầm tay điện thương hiệu Toyoko chính hãng tại Việt Nam. Máy khoan, máy mài, máy cưa và nhiều loại máy công cụ khác.',
  keywords: 'Toyoko, máy cầm tay, máy khoan, máy mài, máy cưa, Quang Phú',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${roboto.variable} ${robotoCondensed.variable}`}>{children}</body>
    </html>
  )
}
