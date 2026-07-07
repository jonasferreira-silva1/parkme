// =============================================================
// SEED DOCKER — Versão JS pura para rodar dentro do container
// Não depende de ts-node. Executado pelo entrypoint.sh
// quando o banco está vazio.
// =============================================================

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed automático iniciado...')

  const senhaHash = await bcrypt.hash('Senha@123', 10)

  // Usuários
  const motorista = await prisma.user.create({
    data: { name: 'João Silva',     email: 'joao@parkme.com',      passwordHash: senhaHash, phone: '11999990001', role: 'DRIVER',   pcd: false },
  })
  const motoristaPcd = await prisma.user.create({
    data: { name: 'Maria Oliveira', email: 'maria@parkme.com',     passwordHash: senhaHash, phone: '11999990002', role: 'DRIVER',   pcd: true  },
  })
  await prisma.user.create({
    data: { name: 'Carlos Operador',email: 'operador@parkme.com',  passwordHash: senhaHash, role: 'OPERATOR' },
  })
  await prisma.user.create({
    data: { name: 'Admin Sistema',  email: 'admin@parkme.com',     passwordHash: senhaHash, role: 'ADMIN'    },
  })

  // Veículos
  const v1 = await prisma.vehicle.create({
    data: { userId: motorista.id,    plate: 'ABC1D23', brand: 'Toyota', model: 'Corolla', color: 'Prata'  },
  })
  const v2 = await prisma.vehicle.create({
    data: { userId: motoristaPcd.id, plate: 'XYZ9A87', brand: 'Honda',  model: 'Fit',     color: 'Branco' },
  })

  // Estacionamento
  const lot = await prisma.parkingLot.create({
    data: { id: 'lot_001', name: 'ParkMe Shopping Center', address: 'Av. Paulista, 1000 - São Paulo/SP', floors: 3, totalSpots: 120, pricePerHour: 15.00, dynamicPricing: true },
  })

  // Vagas
  const vagas = []
  const setores = ['A', 'B']
  for (let andar = 1; andar <= 3; andar++) {
    for (const setor of setores) {
      for (let num = 1; num <= 20; num++) {
        let tipo = 'STANDARD'
        if (andar === 1 && num <= 2) tipo = 'DISABLED'
        else if (num >= 19) tipo = 'VIP'
        vagas.push({ lotId: lot.id, floor: andar, sector: setor, number: num, status: 'FREE', type: tipo, coordX: (num - 1) * 65, coordY: setores.indexOf(setor) * 80 })
      }
    }
  }
  await prisma.spot.createMany({ data: vagas })
  const vagasCriadas = await prisma.spot.findMany({ where: { lotId: lot.id }, orderBy: [{ floor: 'asc' }, { sector: 'asc' }, { number: 'asc' }] })

  // Sessões concluídas (21) com pagamentos
  const agora = new Date()
  const configs = [
    { d: 0, h: 8,  m: 90  }, { d: 0, h: 9,  m: 120 }, { d: 0, h: 10, m: 45  },
    { d: 0, h: 11, m: 200 }, { d: 0, h: 14, m: 75  }, { d: 0, h: 15, m: 160 },
    { d: 1, h: 9,  m: 110 }, { d: 1, h: 10, m: 95  }, { d: 1, h: 13, m: 240 },
    { d: 1, h: 16, m: 60  }, { d: 2, h: 8,  m: 180 }, { d: 2, h: 11, m: 130 },
    { d: 2, h: 14, m: 90  }, { d: 3, h: 9,  m: 75  }, { d: 3, h: 10, m: 210 },
    { d: 4, h: 8,  m: 120 }, { d: 4, h: 12, m: 150 }, { d: 5, h: 10, m: 80  },
    { d: 5, h: 14, m: 100 }, { d: 6, h: 9,  m: 190 }, { d: 6, h: 15, m: 65  },
  ]
  const metodos = ['PIX', 'PIX', 'CREDIT', 'PIX', 'DEBIT', 'CREDIT', 'PIX']
  let receitaTotal = 0

  for (let i = 0; i < configs.length; i++) {
    const cfg     = configs[i]
    const vaga    = vagasCriadas[i % 30]
    const veiculo = i % 2 === 0 ? v1 : v2
    const entrada = new Date(agora); entrada.setDate(entrada.getDate() - cfg.d); entrada.setHours(cfg.h, 0, 0, 0)
    const saida   = new Date(entrada); saida.setMinutes(saida.getMinutes() + cfg.m)
    const horas   = Math.max(cfg.m / 60, 1)
    const fator   = i % 5 === 0 ? 1.2 : 1.0
    const valor   = parseFloat((horas * 15 * fator).toFixed(2))
    receitaTotal += valor

    const sessao = await prisma.session.create({
      data: { vehicleId: veiculo.id, spotId: vaga.id, entryAt: entrada, exitAt: saida, totalMinutes: cfg.m, totalAmount: valor, status: 'COMPLETED' },
    })
    const paidAt = new Date(saida); paidAt.setMinutes(paidAt.getMinutes() + 5)
    await prisma.payment.create({
      data: { sessionId: sessao.id, amount: valor, method: metodos[i % metodos.length], status: 'APPROVED', mpPaymentId: `MP_DEMO_${sessao.id.slice(-8).toUpperCase()}`, paidAt },
    })
  }

  // Vagas ocupadas (~40%)
  const vagasParaOcupar = vagasCriadas.filter(v => v.type === 'STANDARD').slice(0, 48)
  await prisma.spot.updateMany({ where: { id: { in: vagasParaOcupar.map(v => v.id) } }, data: { status: 'OCCUPIED' } })

  for (let i = 0; i < vagasParaOcupar.length; i++) {
    const veiculo    = i % 2 === 0 ? v1 : v2
    const horasAtras = 0.5 + (i % 3) * 0.5
    const entradaAtiva = new Date(agora.getTime() - horasAtras * 3600 * 1000)
    await prisma.session.create({ data: { vehicleId: veiculo.id, spotId: vagasParaOcupar[i].id, entryAt: entradaAtiva, status: 'ACTIVE' } })
  }

  console.log(`✅ Seed concluído! Receita demo: R$ ${receitaTotal.toFixed(2)} | 48 vagas ocupadas`)
}

main()
  .catch(e => { console.error('❌ Seed falhou:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
