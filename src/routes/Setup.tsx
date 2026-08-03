import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Field } from '../components/Field'
import { AuthLayout } from '../components/AuthLayout'

interface FormState {
  name: string
  phone: string
  email: string
  password: string
}

const initialForm: FormState = { name: '', phone: '', email: '', password: '' }

export default function Setup() {
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.rpc('has_super_admin').then(({ data, error: rpcError }) => {
      if (rpcError) {
        console.error('부트스트랩 상태 확인 실패:', rpcError.message)
      }
      setAlreadyDone(Boolean(data))
      setChecking(false)
    })
  }, [])

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (signUpError || !signUpData.user) {
      setLoading(false)
      setError('계정 생성 실패: ' + (signUpError?.message ?? '알 수 없는 오류'))
      return
    }
    if (!signUpData.session) {
      setLoading(false)
      setError('이메일 인증이 필요한 상태입니다. Supabase 인증 설정(Confirm email)을 확인해주세요.')
      return
    }

    const { error: bootstrapError } = await supabase.rpc('bootstrap_super_admin', {
      p_name: form.name,
      p_phone: form.phone || null,
    })

    setLoading(false)
    if (bootstrapError) {
      setError(
        bootstrapError.message === 'already_bootstrapped'
          ? '이미 다른 슈퍼관리자가 설정되었습니다. 로그인 화면에서 로그인해주세요.'
          : '슈퍼관리자 등록 실패: ' + bootstrapError.message,
      )
      return
    }

    await refreshProfile()
    navigate('/')
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-base text-muted-foreground">
        확인 중...
      </div>
    )
  }

  if (alreadyDone) {
    return (
      <AuthLayout title="설정이 이미 완료되었습니다" subtitle="슈퍼관리자 계정이 이미 존재합니다">
        <p className="text-base text-muted-foreground">
          최초 슈퍼관리자 등록은 한 번만 가능합니다. 로그인 화면에서 로그인해주세요.
        </p>
        <Link
          to="/login"
          className="mt-5 block w-full rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-3 text-center text-base font-semibold text-accent-foreground hover:brightness-105"
        >
          로그인하러 가기
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="최초 슈퍼관리자 등록"
      subtitle="하미담 시스템을 처음 설정합니다. 이 화면은 슈퍼관리자가 한 명도 없을 때만 사용할 수 있습니다."
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-accent hover:underline">
          로그인으로 돌아가기
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="성함" value={form.name} onChange={update('name')} />
        <Field label="연락처" value={form.phone} onChange={update('phone')} />
        <Field label="이메일(로그인 아이디)" type="email" value={form.email} onChange={update('email')} />
        <Field label="비밀번호" type="password" value={form.password} onChange={update('password')} />
        {error && <p className="text-base text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '슈퍼관리자로 등록'}
        </button>
      </form>
    </AuthLayout>
  )
}
