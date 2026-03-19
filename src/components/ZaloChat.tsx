'use client'
import { useEffect } from 'react'
import styles from './ZaloChat.module.css'

const OA_ID = process.env.NEXT_PUBLIC_ZALO_OA_ID || 'YOUR_ZALO_OA_ID'

export default function ZaloChat() {
  useEffect(() => {
    // Load Zalo OA Chat script
    const script = document.createElement('script')
    script.src = 'https://sp.zalo.me/plugins/sdk.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  return (
    <div className={styles.wrapper}>
      {/* Official Zalo OA Chat Button */}
      <div
        className="zalo-chat-widget"
        data-oaid={OA_ID}
        data-welcome-message="Xin chào! Quang Phú hỗ trợ bạn về máy Toyoko. Để lại tin nhắn, chúng tôi sẽ phản hồi sớm nhất."
        data-autopopup="0"
        data-width="350"
        data-height="420"
      />
    </div>
  )
}
