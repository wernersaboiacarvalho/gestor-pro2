export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false

  const calcCheck = (factor: number) =>
    Array.from(digits.slice(0, factor - 1)).reduce((sum, d, i) => sum + parseInt(d) * (factor - i), 0) * 10 % 11 % 10

  return calcCheck(10) === parseInt(digits[9]) && calcCheck(11) === parseInt(digits[10])
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const calcCheck = (weights: number[]) =>
    weights.reduce((sum, w, i) => sum + parseInt(digits[i]) * w, 0) % 11

  const check1 = calcCheck(weights1)
  const check2 = calcCheck(weights2)

  const digit1 = check1 < 2 ? 0 : 11 - check1
  const digit2 = check2 < 2 ? 0 : 11 - check2

  return digit1 === parseInt(digits[12]) && digit2 === parseInt(digits[13])
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 && digits.length <= 11
}

export function isValidPlate(plate: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate.toUpperCase())
}
