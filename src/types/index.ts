export type {
  UserRole,
  BusinessType,
  TenantPlan,
  TenantStatus,
  ServiceOrderType,
  ServiceOrderStatus,
  ServiceOrderItemType,
  FinancialType,
  FinancialStatus,
} from "@/generated/prisma"

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
