import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field } from '../components/Field'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

interface FormState {
  orgName: string
  businessRegNo: string
  orgContactPhone: string
  adminName: string
  adminPhone: string
  adminEmail: string
  adminPassword: string
}

const initialForm: FormState = {
  orgName: '',
  businessRegNo: '',
  orgContactPhone: '',
  adminName: '',
  adminPhone: '',
  adminEmail: '',
  adminPassword: '',
}

export default function SignupPartner() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.adminEmail,
      password: form.adminPassword,
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
      business_reg_no: form.businessRegNo || null,
      contact_phone: form.orgContactPhone || null,
    })

    if (orgError) {
      setLoading(false)
      setError('장례회사 등록 실패: ' + orgError.message)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role: 'org_admin',
      organization_id: orgId,
      name: form.adminName,
      phone: form.adminPhone,
      status: 'pending',
    })

    if (profileError) {
      setLoading(false)
      setError('가입 처리 실패: ' + profileError.message)
      return
    }

    await refreshProfile()
    setLoading(false)
    navigate('/')
  }

  return (
    <AuthLayout
      title="파트너사 가입 신청"
      subtitle="승인 후 이용 가능합니다"
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
        <Field label="담당자 성함" value={form.adminName} onChange={update('adminName')} />
        <Field label="담당자 연락처" value={form.adminPhone} onChange={update('adminPhone')} />
        <Field label="담당자 이메일(로그인 아이디)" type="email" value={form.adminEmail} onChange={update('adminEmail')} />
        <Field label="비밀번호" type="password" value={form.adminPassword} onChange={update('adminPassword')} />
        {error && <p className="text-base text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
        >
          {loading ? '가입 신청 중...' : '가입 신청하기'}
        </button>
      </form>
    </AuthLayout>
  )
}
