import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Field } from '../components/Field'

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">등록 신청이 접수되었습니다</h1>
          <p className="text-sm text-slate-500">하미담 슈퍼관리자 승인 후 로그인하실 수 있습니다.</p>
          <button onClick={() => navigate('/login')} className="mt-2 text-sm text-slate-600 underline">
            로그인 화면으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">파트너 장례회사 등록 신청</h1>
          <p className="mt-1 text-sm text-slate-500">승인 후 사용 가능합니다</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="장례회사명" value={form.orgName} onChange={update('orgName')} />
          <Field label="사업자등록번호" value={form.businessRegNo} onChange={update('businessRegNo')} />
          <Field label="대표 연락처" value={form.orgContactPhone} onChange={update('orgContactPhone')} />
          <Field label="담당자 성함" value={form.name} onChange={update('name')} />
          <Field label="담당자 연락처" value={form.phone} onChange={update('phone')} />
          <Field label="이메일(로그인 아이디)" type="email" value={form.email} onChange={update('email')} />
          <Field label="비밀번호" type="password" value={form.password} onChange={update('password')} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? '제출 중...' : '등록 신청'}
          </button>
        </form>
        <div className="text-center text-sm">
          <Link to="/login" className="text-slate-500 hover:text-slate-900 hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
