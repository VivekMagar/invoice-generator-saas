// types/index.ts

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  total: number
}

export interface Invoice {
  id?: string
  user_id?: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  from_name: string
  from_email: string
  from_address: string
  client_name: string
  client_email: string
  client_address: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  notes: string
  currency: string
  created_at?: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  plan: 'free' | 'pro' | 'business'
  stripe_customer_id?: string
  invoices_this_month: number
}
