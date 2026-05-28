import { describe, it, expect } from "vitest"
import {
  loginSchema,
  registerSchema,
  customerSchema,
  vehicleSchema,
  serviceOrderSchema,
  mechanicSchema,
  inventorySchema,
  supplierSchema,
  partnerSchema,
  financialRecordSchema,
} from "@/lib/validations/schemas"

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "123456" })).toEqual({
      email: "a@b.com",
      password: "123456",
    })
  })

  it("rejects invalid email", () => {
    expect(() => loginSchema.parse({ email: "invalido", password: "123456" })).toThrow()
  })

  it("rejects short password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "123" })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe("registerSchema", () => {
  const valid = {
    name: "João",
    email: "joao@test.com",
    password: "123456",
    confirmPassword: "123456",
    tenantName: "Minha Oficina",
    tenantSlug: "minha-oficina",
  }

  it("accepts valid registration", () => {
    expect(registerSchema.parse(valid)).toEqual(valid)
  })

  it("rejects mismatched passwords", () => {
    expect(() => registerSchema.parse({ ...valid, confirmPassword: "654321" })).toThrow("Senhas não conferem")
  })

  it("rejects invalid slug", () => {
    expect(() => registerSchema.parse({ ...valid, tenantSlug: "Minha Oficina!" })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// customerSchema
// ---------------------------------------------------------------------------
describe("customerSchema", () => {
  const base = { name: "Cliente", phone: "11999999999" }

  it("accepts minimum required fields", () => {
    expect(customerSchema.parse(base)).toMatchObject(base)
  })

  it("accepts full data", () => {
    const data = { ...base, cpf: "529.982.247-25", cnpj: "", email: "c@t.com", address: "Rua X", notes: "obs" }
    expect(customerSchema.parse(data)).toMatchObject(data)
  })

  it("rejects missing name", () => {
    expect(() => customerSchema.parse({ phone: "11999999999" })).toThrow()
  })

  it("rejects invalid email", () => {
    expect(() => customerSchema.parse({ ...base, email: "invalido" })).toThrow()
  })

  it("accepts empty string email", () => {
    expect(customerSchema.parse({ ...base, email: "" })).toMatchObject({ ...base, email: "" })
  })
})

// ---------------------------------------------------------------------------
// vehicleSchema
// ---------------------------------------------------------------------------
describe("vehicleSchema", () => {
  const base = {
    customerId: "c1",
    plate: "ABC1234",
    brand: "VW",
    model: "Gol",
    year: 2020,
  }

  it("accepts valid vehicle", () => {
    expect(vehicleSchema.parse(base)).toMatchObject(base)
  })

  it("accepts Mercosul plate", () => {
    expect(vehicleSchema.parse({ ...base, plate: "ABC1D23" })).toMatchObject({ ...base, plate: "ABC1D23" })
  })

  it("rejects invalid plate", () => {
    expect(() => vehicleSchema.parse({ ...base, plate: "AB-1234" })).toThrow()
  })

  it("rejects missing brand", () => {
    expect(() => vehicleSchema.parse({ ...base, brand: "" })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// serviceOrderSchema
// ---------------------------------------------------------------------------
describe("serviceOrderSchema", () => {
  const base = { vehicleId: "v1", description: "Revisão", discount: 0 }

  it("accepts minimum fields", () => {
    expect(serviceOrderSchema.parse(base)).toMatchObject(base)
  })

  it("accepts with items", () => {
    const data = {
      ...base,
      discount: 10,
      items: [
        { type: "service" as const, description: "Mão de obra", quantity: 1, unitValue: 100 },
        { type: "part" as const, description: "Óleo", quantity: 2, unitValue: 50 },
      ],
    }
    expect(serviceOrderSchema.parse(data)).toMatchObject(data)
  })

  it("rejects missing description", () => {
    expect(() => serviceOrderSchema.parse({ vehicleId: "v1", description: "" })).toThrow()
  })

  it("rejects negative discount", () => {
    expect(() => serviceOrderSchema.parse({ ...base, discount: -1 })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// mechanicSchema
// ---------------------------------------------------------------------------
describe("mechanicSchema", () => {
  it("accepts valid mechanic", () => {
    const data = { name: "Mecânico", active: true }
    expect(mechanicSchema.parse(data)).toMatchObject(data)
  })

  it("accepts optional email as empty string", () => {
    expect(mechanicSchema.parse({ name: "Mec", active: false, email: "" })).toMatchObject({ name: "Mec", active: false, email: "" })
  })
})

// ---------------------------------------------------------------------------
// inventorySchema
// ---------------------------------------------------------------------------
describe("inventorySchema", () => {
  const base = { name: "Filtro", quantity: 10, minQuantity: 2, unitPrice: 50, costPrice: 30 }

  it("accepts valid item", () => {
    expect(inventorySchema.parse(base)).toMatchObject(base)
  })

  it("rejects negative quantity", () => {
    expect(() => inventorySchema.parse({ ...base, quantity: -1 })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// supplierSchema
// ---------------------------------------------------------------------------
describe("supplierSchema", () => {
  it("accepts minimum fields", () => {
    expect(supplierSchema.parse({ name: "Fornecedor" })).toMatchObject({ name: "Fornecedor" })
  })
})

// ---------------------------------------------------------------------------
// partnerSchema
// ---------------------------------------------------------------------------
describe("partnerSchema", () => {
  it("accepts valid partner", () => {
    const data = { name: "Terceirizado", active: true }
    expect(partnerSchema.parse(data)).toMatchObject(data)
  })
})

// ---------------------------------------------------------------------------
// financialRecordSchema
// ---------------------------------------------------------------------------
describe("financialRecordSchema", () => {
  const base = { type: "receivable" as const, description: "Serviço", value: 500, status: "pending" as const, dueDate: "2026-06-15" }

  it("accepts valid record", () => {
    expect(financialRecordSchema.parse(base)).toMatchObject(base)
  })

  it("rejects negative value", () => {
    expect(() => financialRecordSchema.parse({ ...base, value: -1 })).toThrow()
  })

  it("rejects invalid status", () => {
    expect(() => financialRecordSchema.parse({ ...base, status: "invalid" })).toThrow()
  })

  it("rejects invalid type", () => {
    expect(() => financialRecordSchema.parse({ ...base, type: "invalid" })).toThrow()
  })

  it("accepts payable type", () => {
    expect(financialRecordSchema.parse({ ...base, type: "payable" })).toMatchObject({ type: "payable" })
  })
})
