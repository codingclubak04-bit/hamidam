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
        <Link to="/signup/sales-rep" className="text-muted-foreground hover:text-accent hover:underline">
          가입하기(팀장)
        </Link>
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
