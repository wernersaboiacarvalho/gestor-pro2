import { describe, it, expect } from "vitest"
import {
  formatCpf,
  formatCnpj,
  formatPhone,
  formatPlate,
  formatCurrency,
  formatDate,
  slugify,
} from "@/lib/utils/formatters"

describe("formatCpf", () => {
  it("formats 11 digits", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01")
  })

  it("strips non-digits", () => {
    expect(formatCpf("123.456.789-01")).toBe("123.456.789-01")
  })

  it("truncates beyond 11 digits", () => {
    expect(formatCpf("12345678901123")).toBe("123.456.789-01")
  })
})

describe("formatCnpj", () => {
  it("formats 14 digits", () => {
    expect(formatCnpj("11222333444455")).toBe("11.222.333/4444-55")
  })

  it("strips non-digits", () => {
    expect(formatCnpj("11.222.333/4444-55")).toBe("11.222.333/4444-55")
  })
})

describe("formatPhone", () => {
  it("formats 11-digit mobile", () => {
    expect(formatPhone("11999999999")).toBe("(11) 99999-9999")
  })

  it("formats 10-digit landline", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444")
  })

  it("strips non-digits", () => {
    expect(formatPhone("(11) 99999-9999")).toBe("(11) 99999-9999")
  })
})

describe("formatPlate", () => {
  it("uppercases and strips", () => {
    expect(formatPlate("abc-1234")).toBe("ABC1234")
  })

  it("handles Mercosul plate", () => {
    expect(formatPlate("abc1d23")).toBe("ABC1D23")
  })

  it("limits to 7 chars", () => {
    expect(formatPlate("ABC12345")).toBe("ABC1234")
  })
})

describe("formatCurrency", () => {
  const nbsp = "\u00a0"

  it("formats integer", () => {
    expect(formatCurrency(1500)).toBe(`R$${nbsp}1.500,00`)
  })

  it("formats decimal", () => {
    expect(formatCurrency(12.5)).toBe(`R$${nbsp}12,50`)
  })

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe(`R$${nbsp}0,00`)
  })

  it("handles string input", () => {
    expect(formatCurrency("99.90")).toBe(`R$${nbsp}99,90`)
  })
})

describe("formatDate", () => {
  it("formats Date object", () => {
    const d = new Date(2026, 4, 27)
    expect(formatDate(d)).toBe("27/05/2026")
  })

  it("formats ISO string", () => {
    expect(formatDate("2026-05-27T12:00:00")).toBe("27/05/2026")
  })
})

describe("slugify", () => {
  it("converts basic text", () => {
    expect(slugify("Minha Oficina")).toBe("minha-oficina")
  })

  it("removes accents", () => {
    expect(slugify("João Silva")).toBe("joao-silva")
  })

  it("removes special chars", () => {
    expect(slugify("Oficina do João!")).toBe("oficina-do-joao")
  })

  it("collapses multiple hyphens", () => {
    expect(slugify("foo   bar")).toBe("foo-bar")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})
