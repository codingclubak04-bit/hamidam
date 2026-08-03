export type Role = 'super_admin' | 'org_admin' | 'sales_rep'
export type ProfileStatus = 'pending' | 'active' | 'disabled'
export type OrganizationType = 'hamidam_direct' | 'partner_company'
export type OrganizationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  role: Role
  organization_id: string | null
  name: string
  phone: string | null
  status: ProfileStatus
  can_view_all_stats: boolean
  created_at: string
}

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  status: OrganizationStatus
  business_reg_no: string | null
  contact_phone: string | null
  created_at: string
  approved_at: string | null
  approved_by: string | null
}
