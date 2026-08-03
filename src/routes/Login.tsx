import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field } from '../components/Field'
import { AuthLayout } from '../components/AuthLayout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('로그인에 실패했습니다: ' + error.message)
      return
    }
    navigate('/')
  }

  return (
    <AuthLayout
      title="하미담"
      subtitle="영업/주문 관리"
      footer={
        <div className="flex justify-center gap-4 text-muted-foreground">
          <Link to="/signup/partner" className="hover:text-accent hover:underline">
            파트너 장례회사 등록 신청
          </Link>
          <span className="text-foreground/20">|</span>
          <Link to="/signup/sales-rep" className="hover:text-accent hover:underline">
            개인 판매자 가입
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="아이디(이메일)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-base text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </AuthLayout>
  )
}
