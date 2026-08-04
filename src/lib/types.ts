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
  engrave_x_pct: number
  engrave_y_pct: number
  engrave_font_pct: number
  engrave_color: string
  engrave_birth_x_pct: number
  engrave_birth_y_pct: number
  engrave_birth_font_pct: number
  engrave_death_x_pct: number
  engrave_death_y_pct: number
  engrave_death_font_pct: number
  engrave_religion_x_pct: number
  engrave_religion_y_pct: number
  engrave_religion_font_pct: number
  engrave_photo_x_pct: number
  engrave_photo_y_pct: number
  engrave_photo_size_pct: number
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

export const ENGRAVE_FONTS = [
  { value: 'Noto Serif KR', label: '본고딕 세리프 (Noto Serif KR)' },
  { value: 'Nanum Myeongjo', label: '나눔명조' },
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'Song Myung', label: '송명체' },
  { value: 'Gowun Batang', label: '고운바탕' },
] as const

export const DEFAULT_ENGRAVE_FONT = 'Noto Serif KR'

export interface Order {
  id: string
  sales_rep_id: string
  organization_id: string | null
  status: OrderStatus
  urn_product_id: string | null
  urn_price: number | null
  tablet_product_id: string | null
  tablet_price: number | null
  urn_engrave_x_pct: number | null
  urn_engrave_y_pct: number | null
  urn_engrave_font_pct: number | null
  urn_engrave_font_family: string | null
  urn_birth_x_pct: number | null
  urn_birth_y_pct: number | null
  urn_birth_font_pct: number | null
  urn_death_x_pct: number | null
  urn_death_y_pct: number | null
  urn_death_font_pct: number | null
  urn_religion_x_pct: number | null
  urn_religion_y_pct: number | null
  urn_religion_font_pct: number | null
  urn_date_style: string
  tablet_engrave_x_pct: number | null
  tablet_engrave_y_pct: number | null
  tablet_engrave_font_pct: number | null
  tablet_engrave_font_family: string | null
  tablet_birth_x_pct: number | null
  tablet_birth_y_pct: number | null
  tablet_birth_font_pct: number | null
  tablet_death_x_pct: number | null
  tablet_death_y_pct: number | null
  tablet_death_font_pct: number | null
  tablet_religion_x_pct: number | null
  tablet_religion_y_pct: number | null
  tablet_religion_font_pct: number | null
  tablet_photo_url: string | null
  tablet_photo_x_pct: number | null
  tablet_photo_y_pct: number | null
  tablet_photo_size_pct: number | null
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
