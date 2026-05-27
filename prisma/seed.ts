import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"
import "dotenv/config"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PASSWORD = "123456"
const TENANTS_COUNT = 20
const CUSTOMERS_PER_TENANT = [6, 10] // min, max
const VEHICLES_PER_CUSTOMER = [1, 3]
const MECHANICS_PER_TENANT = [3, 5]
const SUPPLIERS_PER_TENANT = [3, 5]
const PARTNERS_PER_TENANT = [3, 5]
const INVENTORY_PER_TENANT = [8, 14]
const ORDERS_PER_TENANT = [8, 15]

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - randInt(0, daysAgo))
  return d
}

const businessTypes = ["workshop", "salon", "gym"] as const

const workshopNames = [
  "Auto Mecânica", "Oficina do Zé", "Mecânica Rápida", "CarService Center",
  "Mecânica Top", "Oficina São Jorge", "Auto Center", "Mecânica de Confiança",
  "Rápido Service", "Mecânica Premium", "Oficina do João", "Auto Mecânica ABC",
  "Mecânica Popular", "Oficina Central", "Mecânica União", "Car Doctor",
  "Mecânica Express", "Oficina Modelo", "Auto Service 24h", "Mecânica Nova Era",
]

const mechanicFirstNames = [
  "Carlos", "Pedro", "Lucas", "Rafael", "Mário", "Jorge", "Roberto", "Eduardo",
  "Antônio", "Paulo", "Marcos", "Fábio", "Ricardo", "Fernando", "Sérgio",
]

const mechanicLastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Almeida",
  "Nascimento", "Araújo", "Barbosa", "Ribeiro", "Gomes", "Martins", "Rocha",
]

const specialtyOptions = [
  "Motor", "Suspensão", "Freios", "Elétrica", "Injeção Eletrônica",
  "Ar Condicionado", "Câmbio", "Funilaria", "Pintura", "Alinhamento",
  "Som e Acessórios", "Vidros", "Escapamento", "Baterias", "Diagnóstico",
]

const customerFirstNames = [
  "João", "Maria", "José", "Ana", "Carlos", "Francisca", "Pedro", "Antônia",
  "Marcos", "Helena", "Lucas", "Rita", "Paulo", "Rosa", "Rafael", "Sônia",
  "Fernando", "Márcia", "Roberto", "Ângela", "Eduardo", "Cristina", "Luiz", "Teresa",
]

const customerLastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Almeida",
  "Carvalho", "Gomes", "Barbosa", "Ribeiro", "Araújo", "Melo", "Cavalcanti",
  "Dias", "Moreira", "Cardoso", "Teixeira", "Nunes",
]

const streetNames = [
  "Rua das Flores", "Av. Paulista", "Rua 7 de Setembro", "Av. Brasil",
  "Rua XV de Novembro", "Rua da Liberdade", "Av. Independência", "Rua do Comércio",
  "Rua São João", "Av. Central", "Rua Boa Vista", "Rua dos Ipês",
  "Av. Getúlio Vargas", "Rua Tiradentes", "Rua dos Andradas", "Av. Rio Branco",
]

const neighborhoods = [
  "Centro", "Jardim América", "Vila Nova", "Bela Vista", "Santa Mônica",
  "Parque Industrial", "Jardim Europa", "Vila Mariana", "Cidade Nova", "Alphaville",
]

const cities = [
  "São Paulo", "Campinas", "Ribeirão Preto", "São José dos Campos",
  "Sorocaba", "Jundiaí", "Piracicaba", "Bauru",
]

const carBrandModel: Record<string, string[]> = {
  VW: ["Gol", "Polo", "Saveiro", "T-Cross", "Nivus"],
  Fiat: ["Uno", "Mobi", "Strada", "Toro", "Pulse"],
  Chevrolet: ["Onix", "Prisma", "Cruze", "Tracker", "S10"],
  Ford: ["Ka", "EcoSport", "Ranger", "Territory", "Focus"],
  Honda: ["Civic", "City", "HR-V", "Fit", "CR-V"],
  Toyota: ["Corolla", "Etios", "Yaris", "Hilux", "SW4"],
  Renault: ["Kwid", "Sandero", "Duster", "Captur", "Oroch"],
  Hyundai: ["HB20", "Creta", "Tucson", "i30", "Santa Fe"],
  Jeep: ["Renegade", "Compass", "Wrangler", "Cherokee", "Commander"],
  Nissan: ["Kicks", "Versa", "Sentra", "Frontier", "March"],
}

const colors = ["Branco", "Preto", "Prata", "Vermelho", "Azul", "Verde", "Cinza", "Marrom", "Bege", "Amarelo"]

const partNames = [
  "Filtro de Óleo", "Filtro de Ar", "Pastilha de Freio", "Óleo 5W30",
  "Óleo 10W40", "Correia Dentada", "Velas de Ignição", "Amortecedor Dianteiro",
  "Amortecedor Traseiro", "Kit Embreagem", "Bateria 60Ah", "Bateria 70Ah",
  "Discos de Freio", "Lâmpada Farol", "Lâmpada Lanterna", "Palheta Limpador",
  "Radiador", "Válvula Termostática", "Mangueira d'Água", "Junta do Cabeçote",
  "Pneu 175/65R14", "Pneu 185/60R15", "Pneu 205/55R16", "Óleo de Câmbio",
  "Aditivo Radiador", "Cabo de Vela", "Bobina de Ignição", "Sensor de Oxigênio",
  "Bomba d'Água", "Termostato",
]

const partCategories: Record<string, string> = {
  "Filtro de Óleo": "Filtros", "Filtro de Ar": "Filtros", "Pastilha de Freio": "Freios",
  "Óleo 5W30": "Lubrificantes", "Óleo 10W40": "Lubrificantes", "Correia Dentada": "Motor",
  "Velas de Ignição": "Motor", "Amortecedor Dianteiro": "Suspensão", "Amortecedor Traseiro": "Suspensão",
  "Kit Embreagem": "Motor", "Bateria 60Ah": "Elétrica", "Bateria 70Ah": "Elétrica",
  "Discos de Freio": "Freios", "Lâmpada Farol": "Elétrica", "Lâmpada Lanterna": "Elétrica",
  "Palheta Limpador": "Acessórios", "Radiador": "Motor", "Válvula Termostática": "Motor",
  "Mangueira d'Água": "Motor", "Junta do Cabeçote": "Motor",
  "Pneu 175/65R14": "Pneus", "Pneu 185/60R15": "Pneus", "Pneu 205/55R16": "Pneus",
  "Óleo de Câmbio": "Lubrificantes", "Aditivo Radiador": "Lubrificantes", "Cabo de Vela": "Motor",
  "Bobina de Ignição": "Elétrica", "Sensor de Oxigênio": "Motor", "Bomba d'Água": "Motor",
  "Termostato": "Motor",
}

const serviceDescriptions = [
  "Troca de óleo e filtros",
  "Revisão completa 40.000 km",
  "Troca de pastilhas de freio",
  "Alinhamento e balanceamento",
  "Troca de amortecedores dianteiros",
  "Troca de correia dentada",
  "Diagnóstico de injeção eletrônica",
  "Reparo no ar condicionado",
  "Troca de bateria",
  "Troca de velas e cabos",
  "Reparo no sistema de escapamento",
  "Troca de kit embreagem",
  "Revisão preventiva",
  "Troca de pneus dianteiros",
  "Reparo elétrico completo",
  "Troca de discos de freio",
  "Serviço de funilaria e pintura",
  "Troca do radiador",
  "Limpeza de bicos injetores",
  "Revisão de suspensão",
]

const partnerServiceTypes = [
  "Funilaria", "Pintura", "Retífica de Motor", "Ar Condicionado",
  "Som e Acessórios", "Guincho", "Vidros", "Bancos e Estofados",
  "Alinhamento", "Injeção Eletrônica",
]

const supplierNames = [
  "Auto Peças Center", "Distribuidora de Óleos", "Peças e Cia",
  "Rodo Peças Ltda", "Mecauto Distribuidora", "Pneu Bom",
  "Elétrica Automotiva", "Baterias Forte", "Filtros Brasil",
  "Amortecedores ABC", "Distribuidora de Lubrificantes", "Retífica Central",
  "Auto Elétrica", "Peças Originais S.A.", "Distribuidora Nacional",
  "Importadora de Peças", "Made in Brasil Peças", "Mercopar Distribuidora",
  "Autopeças União", "Super Peças",
]

const orderStatusSequence = ["draft", "sent", "approved", "in_progress", "completed", "delivered", "cancelled"]

function generateCpf(): string {
  const n = Array.from({ length: 9 }, () => randInt(0, 9))
  const d1 = n.reduce((s, d, i) => s + d * (10 - i), 0) * 10 % 11 % 10
  const d2 = [...n, d1].reduce((s, d, i) => s + d * (11 - i), 0) * 10 % 11 % 10
  return `${n.slice(0, 3).join("")}.${n.slice(3, 6).join("")}.${n.slice(6, 9).join("")}-${d1}${d2}`
}

function generateCnpj(): string {
  const n = Array.from({ length: 12 }, () => randInt(0, 9))
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = w1.reduce((s, w, i) => s + n[i] * w, 0) % 11
  const d1v = d1 < 2 ? 0 : 11 - d1
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d2 = [...n, d1v].reduce((s, d, i) => s + d * w2[i], 0) % 11
  const d2v = d2 < 2 ? 0 : 11 - d2
  return `${n.slice(0, 2).join("")}.${n.slice(2, 5).join("")}.${n.slice(5, 8).join("")}/${n.slice(8, 12).join("")}-${d1v}${d2v}`
}

function generatePlate(index: number): string {
  const letters = String.fromCharCode(65 + (index % 26))
  return `ABC${String(index).padStart(4, "0")}`
}

async function main() {
  console.log("🌱 Iniciando seed de dados...\n")

  const passwordHash = await hash(PASSWORD, 10)

  // Track totals
  const totals = {
    tenants: 0,
    users: 0,
    customers: 0,
    vehicles: 0,
    mechanics: 0,
    suppliers: 0,
    partners: 0,
    inventory: 0,
    orders: 0,
    orderItems: 0,
    financialRecords: 0,
  }

  for (let t = 0; t < TENANTS_COUNT; t++) {
    const name = workshopNames[t]
    const slug = name.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const businessType = pick([...businessTypes])

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: `${slug}-${t}`,
        businessType,
        plan: pick(["free", "basic", "premium"]),
        status: pick(["active", "active", "active", "suspended"]),
      },
    })
    totals.tenants++

    // Tenant admin user
    await prisma.user.create({
      data: {
        email: `admin@${slug}-${t}.com`,
        password: passwordHash,
        name: `Admin ${name}`,
        role: "admin",
        tenantId: tenant.id,
      },
    })
    totals.users++

    // 0-1 extra users
    if (Math.random() > 0.5) {
      await prisma.user.create({
        data: {
          email: `user@${slug}-${t}.com`,
          password: passwordHash,
          name: `Usuário ${name}`,
          role: "user",
          tenantId: tenant.id,
        },
      })
      totals.users++
    }

    // --- Mechanics ---
    const mechCount = randInt(...MECHANICS_PER_TENANT)
    const mechIds: string[] = []
    for (let m = 0; m < mechCount; m++) {
      const mech = await prisma.mechanic.create({
        data: {
          tenantId: tenant.id,
          name: `${pick(mechanicFirstNames)} ${pick(mechanicLastNames)}`,
          email: `mecanico${m}@${slug}-${t}.com`,
          phone: `(11) 9${String(randInt(1000, 9999))}-${String(randInt(1000, 9999))}`,
          cpf: generateCpf(),
          specialty: pick(specialtyOptions),
          active: Math.random() > 0.15,
        },
      })
      mechIds.push(mech.id)
      totals.mechanics++
    }

    // --- Suppliers ---
    const supCount = randInt(...SUPPLIERS_PER_TENANT)
    const supIds: string[] = []
    for (let s = 0; s < supCount; s++) {
      const sup = await prisma.supplier.create({
        data: {
          tenantId: tenant.id,
          name: pick(supplierNames),
          cnpj: generateCnpj(),
          phone: `(11) ${String(randInt(2000, 9999))}-${String(randInt(1000, 9999))}`,
          email: `fornecedor${s}@${slug}-${t}.com`,
          address: `${pick(streetNames)}, ${randInt(100, 9999)} - ${pick(neighborhoods)}`,
        },
      })
      supIds.push(sup.id)
      totals.suppliers++
    }

    // --- Partners ---
    const partCount = randInt(...PARTNERS_PER_TENANT)
    const partnerIds: string[] = []
    for (let p = 0; p < partCount; p++) {
      const partner = await prisma.partner.create({
        data: {
          tenantId: tenant.id,
          name: `${pick(mechanicFirstNames)} ${pick(mechanicLastNames)}`,
          cnpj: generateCnpj(),
          phone: `(11) 9${String(randInt(1000, 9999))}-${String(randInt(1000, 9999))}`,
          email: `terceirizado${p}@${slug}-${t}.com`,
          contactName: `${pick(mechanicFirstNames)} ${pick(mechanicLastNames)}`,
          serviceType: pick(partnerServiceTypes),
          address: `${pick(streetNames)}, ${randInt(100, 9999)}`,
          active: Math.random() > 0.1,
        },
      })
      partnerIds.push(partner.id)
      totals.partners++
    }

    // --- Inventory ---
    const invCount = randInt(...INVENTORY_PER_TENANT)
    const invIds: string[] = []
    for (let i = 0; i < invCount; i++) {
      const name = pick(partNames)
      const item = await prisma.inventoryItem.create({
        data: {
          tenantId: tenant.id,
          name,
          sku: `${slug?.toUpperCase().slice(0, 3)}-${String(i).padStart(3, "0")}`,
          category: partCategories[name] || "Geral",
          quantity: randInt(0, 50),
          minQuantity: randInt(1, 5),
          unitPrice: randInt(1500, 50000), // cents
          costPrice: randInt(800, 35000),
          supplierId: pick(supIds),
        },
      })
      invIds.push(item.id)
      totals.inventory++
    }

    // --- Customers + Vehicles ---
    const custCount = randInt(...CUSTOMERS_PER_TENANT)
    const custIds: string[] = []
    for (let c = 0; c < custCount; c++) {
      const firstName = pick(customerFirstNames)
      const lastName = pick(customerLastNames)
      const hasCpf = Math.random() > 0.3
      const customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: `${firstName} ${lastName}`,
          cpf: hasCpf ? generateCpf() : null,
          cnpj: hasCpf ? null : generateCnpj(),
          phone: `(11) 9${String(randInt(1000, 9999))}-${String(randInt(1000, 9999))}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          address: `${pick(streetNames)}, ${randInt(100, 9999)} - ${pick(neighborhoods)}, ${pick(cities)} - SP`,
          notes: Math.random() > 0.6 ? "Cliente preferencial" : null,
        },
      })
      custIds.push(customer.id)
      totals.customers++

      // 1-3 vehicles per customer
      const vCount = randInt(...VEHICLES_PER_CUSTOMER)
      const brands = Object.keys(carBrandModel)
      for (let v = 0; v < vCount; v++) {
        const brand = pick(brands)
        const models = carBrandModel[brand]
        await prisma.vehicle.create({
          data: {
            tenantId: tenant.id,
            customerId: customer.id,
            plate: generatePlate(totals.vehicles),
            brand,
            model: pick(models),
            year: randInt(2005, 2025),
            color: pick(colors),
            notes: null,
          },
        })
        totals.vehicles++
      }
    }

    // --- Get all vehicles for service orders ---
    const tenantVehicles = await prisma.vehicle.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, customerId: true },
    })

    // --- Service Orders ---
    const orderCount = randInt(...ORDERS_PER_TENANT)
    for (let o = 0; o < orderCount; o++) {
      const vehicle = pick(tenantVehicles)
      const isBudget = Math.random() > 0.6
      const type = isBudget ? "budget" : "service_order"
      const status = isBudget
        ? pick(["draft", "draft", "draft", "sent", "approved", "rejected"])
        : pick(orderStatusSequence)

      const itemCount = randInt(1, 5)
      let totalValue = 0
      const items: Array<{
        type: string
        description: string
        quantity: number
        unitValue: number
        totalValue: number
        partnerId?: string
        partnerCost?: number
        inventoryItemId?: string
      }> = []

      for (let it = 0; it < itemCount; it++) {
        const isService = Math.random() > 0.4
        const unitValue = isService ? randInt(8000, 40000) : randInt(1500, 25000)
        const quantity = isService ? 1 : randInt(1, 3)
        const itemTotal = unitValue * quantity
        totalValue += itemTotal

        const itemData: any = {
          type: isService ? "service" : "part",
          description: isService ? pick(serviceDescriptions) : pick(partNames),
          quantity,
          unitValue,
          totalValue: itemTotal,
        }

        if (isService && partnerIds.length > 0 && Math.random() > 0.6) {
          itemData.partnerId = pick(partnerIds)
          itemData.partnerCost = Math.round(unitValue * 0.6)
        }

        if (!isService && invIds.length > 0 && Math.random() > 0.3) {
          itemData.inventoryItemId = pick(invIds)
        }

        items.push(itemData)
      }

      const discount = Math.random() > 0.8 ? randInt(500, totalValue * 0.15) : 0
      const os = await prisma.serviceOrder.create({
        data: {
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          orderNumber: `${String(t).padStart(2, "0")}${String(o).padStart(4, "0")}`,
          type,
          status,
          description: pick(serviceDescriptions),
          totalValue,
          discount,
          notes: Math.random() > 0.7 ? "Observação do serviço" : null,
          createdAt: randomDate(90),
          approvedAt: ["approved", "in_progress", "completed", "delivered"].includes(status) ? randomDate(60) : null,
          startedAt: ["in_progress", "completed", "delivered"].includes(status) ? randomDate(45) : null,
          completedAt: ["completed", "delivered"].includes(status) ? randomDate(30) : null,
          deliveredAt: status === "delivered" ? randomDate(15) : null,
        },
      })
      totals.orders++

      // Create items
      for (const item of items) {
        await prisma.serviceOrderItem.create({
          data: {
            serviceOrderId: os.id,
            tenantId: tenant.id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitValue: item.unitValue,
            totalValue: item.totalValue,
            partnerId: (item as any).partnerId,
            partnerCost: (item as any).partnerCost,
            inventoryItemId: (item as any).inventoryItemId,
          },
        })
        totals.orderItems++
      }

      // --- Financial records for completed/delivered service orders ---
      if (["completed", "delivered"].includes(status)) {
        const netValue = totalValue - discount
        await prisma.financialRecord.create({
          data: {
            tenantId: tenant.id,
            type: "receivable",
            description: `OS #${os.orderNumber} - ${os.description}`,
            value: netValue,
            status: Math.random() > 0.3 ? "paid" : "pending",
            dueDate: (() => {
              const d = new Date(os.createdAt)
              d.setDate(d.getDate() + randInt(15, 45))
              return d
            })(),
            paidAt: Math.random() > 0.3 ? new Date(os.createdAt) : null,
            category: "Serviços",
            serviceOrderId: os.id,
          },
        })
        totals.financialRecords++
      }
    }
  }

  console.log("\n✅ Seed concluído!\n")
  console.log("📊 Resumo:")
  console.log(`   Tenants:        ${totals.tenants}`)
  console.log(`   Usuários:       ${totals.users}`)
  console.log(`   Clientes:       ${totals.customers}`)
  console.log(`   Veículos:       ${totals.vehicles}`)
  console.log(`   Mecânicos:      ${totals.mechanics}`)
  console.log(`   Fornecedores:   ${totals.suppliers}`)
  console.log(`   Terceirizados:  ${totals.partners}`)
  console.log(`   Itens Estoque:  ${totals.inventory}`)
  console.log(`   Ordens:         ${totals.orders}`)
  console.log(`   Itens de OS:    ${totals.orderItems}`)
  console.log(`   Financeiro:     ${totals.financialRecords}`)
  console.log(`\nTotal registros: ${Object.values(totals).reduce((a, b) => a + b, 0)}`)
  console.log(`\n🔑 Senha padrão para todos os usuários: ${PASSWORD}`)
  console.log(`   Emails: admin@{tenant-slug}-{n}.com, user@{tenant-slug}-{n}.com`)
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
