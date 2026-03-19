import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ZaloChat from '@/components/ZaloChat'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '72px' }}>{children}</main>
      <Footer />
      <ZaloChat />
    </>
  )
}
