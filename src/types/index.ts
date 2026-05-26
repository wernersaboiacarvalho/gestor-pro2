export type BusinessType = "workshop" | "salon" | "gym"

export type UserRole = "super_admin" | "admin" | "user"

export type ServiceOrderStatus = "pending" | "in_progress" | "completed" | "cancelled"

export type FinancialType = "receivable" | "payable"

export type FinancialStatus = "pending" | "paid" | "cancelled"

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
