import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field } from '../components/Field'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">하미담</h1>
          <p className="mt-1 text-sm text-slate-500">영업/주문 관리</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="아이디(이메일)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="flex justify-center gap-4 text-sm text-slate-500">
          <Link to="/signup/partner" className="hover:text-slate-900 hover:underline">
            파트너 장례회사 등록 신청
          </Link>
          <span className="text-slate-300">|</span>
          <Link to="/signup/sales-rep" className="hover:text-slate-900 hover:underline">
            개인 판매자 가입
          </Link>
        </div>
      </div>
    </div>
  )
}
