import { z } from "zod"
import { isValidCPF, isValidCNPJ } from "./cpf-cnpj"
import {
  BusinessType,
  TenantPlan,
  TenantStatus,
  ServiceOrderItemType,
  FinancialType,
  FinancialStatus,
} from "@/generated/prisma"

const cpfSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || val === "" || isValidCPF(val),
    { message: "CPF inválido" }
  )

const cnpjSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || val === "" || isValidCNPJ(val),
    { message: "CNPJ inválido" }
  )

const plateSchema = z
  .string()
  .transform((val) => val.replace("-", "").toUpperCase())
  .pipe(
    z.string().regex(
      /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/,
      "Placa inválida (ex: ABC1234 ou ABC1D23)"
    )
  )

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
  tenantName: z.string().min(2, "Mínimo 2 caracteres"),
  tenantSlug: z.string().min(3, "Mínimo 3 caracteres").regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
})

export const customerSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  cpf: cpfSchema,
  cnpj: cnpjSchema,
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const vehicleSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  plate: plateSchema,
  brand: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.number().int().min(1950, "Ano inválido").max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  notes: z.string().optional(),
})

export const serviceOrderSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  mechanicId: z.string().optional().nullable(),
  description: z.string().min(3, "Descrição é obrigatória"),
  notes: z.string().optional(),
  discount: z.number().min(0),
  items: z.array(z.object({
    type: z.enum(ServiceOrderItemType),
    description: z.string().min(1, "Descrição do item é obrigatória"),
    quantity: z.number().int().min(1),
    unitValue: z.number().min(0),
    partnerId: z.string().optional().nullable(),
    partnerCost: z.number().min(0).optional(),
    inventoryItemId: z.string().optional().nullable(),
  })).optional(),
})

export const mechanicSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  cpf: cpfSchema,
  specialty: z.string().optional(),
  active: z.boolean(),
})

export const inventorySchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0),
  unitPrice: z.number().min(0),
  costPrice: z.number().min(0),
  supplierId: z.string().optional().nullable(),
})

export const tenantSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  businessType: z.enum(BusinessType),
  plan: z.enum(TenantPlan).default(TenantPlan.free),
  status: z.enum(TenantStatus).default(TenantStatus.active).optional(),
})

export const supplierSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  cnpj: cnpjSchema,
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const partnerSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  cnpj: cnpjSchema,
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  contactName: z.string().optional(),
  serviceType: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean(),
})

export const financialRecordSchema = z.object({
  type: z.enum(FinancialType),
  description: z.string().min(2, "Descrição é obrigatória"),
  value: z.number().min(0, "Valor deve ser positivo"),
  status: z.enum(FinancialStatus),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  category: z.string().optional(),
  serviceOrderId: z.string().optional().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type VehicleInput = z.infer<typeof vehicleSchema>
export type ServiceOrderInput = z.infer<typeof serviceOrderSchema>
export type MechanicInput = z.infer<typeof mechanicSchema>
export type InventoryInput = z.infer<typeof inventorySchema>
export type TenantInput = z.infer<typeof tenantSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type PartnerInput = z.infer<typeof partnerSchema>
export type FinancialRecordInput = z.infer<typeof financialRecordSchema>
