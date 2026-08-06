import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { AdminShell } from '../components/AdminShell'

const inviteUrl = `${window.location.origin}/signup/sales-rep`

export default function AdminInvite() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, inviteUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#14122a', light: '#ffffff' },
    }).catch(() => setError('QR 코드 생성에 실패했습니다.'))
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'hamidam-sales-rep-invite-qr.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <AdminShell title="영업사원 초대 QR">
      <div className="rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur sm:p-8">
        <p className="text-sm text-muted-foreground">
          이 QR코드를 스캔하면 영업사원 회원가입 페이지로 이동합니다. 가입 후 접속 기기에 맞춰 홈 화면 추가(설치) 안내가 자동으로 표시됩니다.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="rounded-xl border border-border bg-white p-4">
              <canvas ref={canvasRef} />
            </div>
          )}

          <div className="w-full max-w-md rounded-lg bg-input/60 px-3.5 py-2.5 text-center text-sm text-foreground break-all">
            {inviteUrl}
          </div>

          <div className="flex w-full max-w-md gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {copied ? '복사됨' : '링크 복사'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:brightness-105"
            >
              QR 이미지 다운로드
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
