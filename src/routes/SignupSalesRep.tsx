import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

interface FormState {
  name: string
  phone: string
  email: string
  password: string
  organizationId: string
}

interface PartnerOrg {
  id: string
  name: string
}

const initialForm: FormState = { name: '', phone: '', email: '', password: '', organizationId: '' }

export default function SignupSalesRep() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [orgs, setOrgs] = useState<PartnerOrg[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  useEffect(() => {
    supabase.rpc('list_partner_organizations').then(({ data, error: rpcError }) => {
      if (rpcError) {
        console.error('회사 목록 조회 실패:', rpcError.message)
        return
      }
      setOrgs(data ?? [])
    })
  }, [])

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role: 'sales_rep',
      organization_id: form.organizationId || null,
      name: form.name,
      phone: form.phone,
      status: 'active',
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
      title="팀장 가입"
      subtitle="가입 즉시 이용 가능합니다"
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
        <Select label="소속 회사 (선택)" value={form.organizationId} onChange={update('organizationId')}>
          <option value="">선택 안 함 — 독립 팀장</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        {error && <p className="text-base text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </AuthLayout>
  )
}
