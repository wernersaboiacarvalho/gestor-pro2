import { describe, it, expect } from "vitest"
import { isValidCpf, isValidCnpj, isValidPhone, isValidPlate } from "@/lib/utils/validators"

describe("isValidCpf", () => {
  it("accepts valid CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true)
  })

  it("rejects repeated digits", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false)
  })

  it("rejects invalid check digits", () => {
    expect(isValidCpf("123.456.789-00")).toBe(false)
  })

  it("rejects short input", () => {
    expect(isValidCpf("123")).toBe(false)
  })

  it("handles raw digits", () => {
    expect(isValidCpf("52998224725")).toBe(true)
  })
})

describe("isValidCnpj", () => {
  it("accepts valid CNPJ", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true)
  })

  it("rejects repeated digits", () => {
    expect(isValidCnpj("11.111.111/1111-11")).toBe(false)
  })

  it("rejects invalid check digits", () => {
    expect(isValidCnpj("11.222.333/0001-00")).toBe(false)
  })

  it("rejects short input", () => {
    expect(isValidCnpj("123")).toBe(false)
  })

  it("handles raw digits", () => {
    expect(isValidCnpj("11222333000181")).toBe(true)
  })
})

describe("isValidPhone", () => {
  it("accepts 11 digits", () => {
    expect(isValidPhone("11999999999")).toBe(true)
  })

  it("accepts 10 digits", () => {
    expect(isValidPhone("1133334444")).toBe(true)
  })

  it("rejects short phone", () => {
    expect(isValidPhone("119999")).toBe(false)
  })

  it("handles formatted input", () => {
    expect(isValidPhone("(11) 99999-9999")).toBe(true)
  })
})

describe("isValidPlate", () => {
  it("accepts old format", () => {
    expect(isValidPlate("ABC1234")).toBe(true)
  })

  it("accepts Mercosul format", () => {
    expect(isValidPlate("ABC1D23")).toBe(true)
  })

  it("rejects invalid format", () => {
    expect(isValidPlate("AB-1234")).toBe(false)
  })

  it("handles lowercase", () => {
    expect(isValidPlate("abc1234")).toBe(true)
  })
})
