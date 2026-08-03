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

export type ProductType = 'urn' | 'tablet' | 'other'

export interface Product {
  id: string
  category: string
  type: ProductType
  name: string
  model_code: string
  spec: string | null
  price: number
  image_url: string | null
  is_active: boolean
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

export type OrderStatus = 'received' | 'processing' | 'completed' | 'cancelled'

export interface Order {
  id: string
  sales_rep_id: string
  organization_id: string | null
  status: OrderStatus
  urn_product_id: string | null
  urn_price: number | null
  tablet_product_id: string | null
  tablet_price: number | null
  religion: string | null
  deceased_name: string | null
  birth_date: string | null
  birth_date_type: string | null
  death_date: string | null
  death_date_type: string | null
  funeral_home: string | null
  crematorium: string | null
  cremation_datetime: string | null
  burial_place: string | null
  customer_name: string
  customer_phone: string | null
  has_special_notes: boolean
  special_notes: string | null
  created_at: string
}
