import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field } from '../components/Field'
import { AuthLayout } from '../components/AuthLayout'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'

interface FormState {
  orgName: string
  businessRegNo: string
  orgContactPhone: string
  name: string
  phone: string
  email: string
  password: string
}

const initialForm: FormState = {
  orgName: '',
  businessRegNo: '',
  orgContactPhone: '',
  name: '',
  phone: '',
  email: '',
  password: '',
}

export default function SignupPartner() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      setError('회원가입 실패: ' + (signUpError?.message ?? '알 수 없는 오류'))
      return
    }
    if (!signUpData.session) {
      setLoading(false)
      setError('이메일 인증이 필요한 상태입니다. Supabase 인증 설정(Confirm email)을 확인해주세요.')
      return
    }

    const orgId = crypto.randomUUID()
    const { error: orgError } = await supabase.from('organizations').insert({
      id: orgId,
      name: form.orgName,
      type: 'partner_company',
      status: 'pending',
      business_reg_no: form.businessRegNo,
      contact_phone: form.orgContactPhone,
    })

    if (orgError) {
      setLoading(false)
      setError('조직 등록 실패: ' + orgError.message)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role: 'org_admin',
      organization_id: orgId,
      name: form.name,
      phone: form.phone,
      status: 'pending',
    })

    setLoading(false)
    if (profileError) {
      setError('담당자 정보 저장 실패: ' + profileError.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4">
        <ThemeToggle />
        <div className="max-w-sm space-y-4 text-center">
          <MoonMark className="mx-auto h-12 w-12" />
          <h1 className="font-serif-kr text-2xl font-bold text-foreground">등록 신청이 접수되었습니다</h1>
          <p className="text-base text-muted-foreground">하미담 슈퍼관리자 승인 후 로그인하실 수 있습니다.</p>
          <button onClick={() => navigate('/login')} className="mt-2 text-base text-accent underline">
            로그인 화면으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="파트너 장례회사 등록 신청"
      subtitle="승인 후 사용 가능합니다"
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-accent hover:underline">
          로그인으로 돌아가기
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="장례회사명" value={form.orgName} onChange={update('orgName')} />
        <Field label="사업자등록번호" value={form.businessRegNo} onChange={update('businessRegNo')} />
        <Field label="대표 연락처" value={form.orgContactPhone} onChange={update('orgContactPhone')} />
        <Field label="담당자 성함" value={form.name} onChange={update('name')} />
        <Field label="담당자 연락처" value={form.phone} onChange={update('phone')} />
        <Field label="이메일(로그인 아이디)" type="email" value={form.email} onChange={update('email')} />
        <Field label="비밀번호" type="password" value={form.password} onChange={update('password')} />
        {error && <p className="text-base text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
        >
          {loading ? '제출 중...' : '등록 신청'}
        </button>
      </form>
    </AuthLayout>
  )
}
