// =============================================================
// SEED — Popula o banco com dados iniciais para desenvolvimento
// Execute com: npx prisma db seed
// =============================================================

import { PrismaClient, SpotType, SpotStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // -----------------------------------------------------------
  // Limpa os dados anteriores na ordem correta (respeita FK)
  // -----------------------------------------------------------
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.spot.deleteMany();
  await prisma.parkingLot.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // -----------------------------------------------------------
  // Cria usuários de exemplo para cada perfil
  // -----------------------------------------------------------
  const senhaHash = await bcrypt.hash('Senha@123', 10);

  const motorista = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@parkme.com',
      passwordHash: senhaHash,
      phone: '11999990001',
      role: Role.DRIVER,
      pcd: false,
    },
  });

  const motoristaPcd = await prisma.user.create({
    data: {
      name: 'Maria Oliveira',
      email: 'maria@parkme.com',
      passwordHash: senhaHash,
      phone: '11999990002',
      role: Role.DRIVER,
      pcd: true, // Usuária PCD — terá prioridade em vagas especiais
    },
  });

  const operador = await prisma.user.create({
    data: {
      name: 'Carlos Operador',
      email: 'operador@parkme.com',
      passwordHash: senhaHash,
      role: Role.OPERATOR,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Sistema',
      email: 'admin@parkme.com',
      passwordHash: senhaHash,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Usuários criados:', { motorista: motorista.email, operador: operador.email, admin: admin.email });

  // -----------------------------------------------------------
  // Cria veículos para os motoristas
  // -----------------------------------------------------------
  const veiculo1 = await prisma.vehicle.create({
    data: {
      userId: motorista.id,
      plate: 'ABC1D23',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'Prata',
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: motoristaPcd.id,
      plate: 'XYZ9A87',
      brand: 'Honda',
      model: 'Fit',
      color: 'Branco',
    },
  });

  console.log('✅ Veículos criados');

  // -----------------------------------------------------------
  // Cria o estacionamento principal com preço dinâmico
  // -----------------------------------------------------------
  const estacionamento = await prisma.parkingLot.create({
    data: {
      name: 'ParkMe Shopping Center',
      address: 'Av. Paulista, 1000 - São Paulo/SP',
      floors: 3,
      totalSpots: 120,
      pricePerHour: 15.00, // R$ 15,00 por hora
      dynamicPricing: true,
    },
  });

  console.log('✅ Estacionamento criado:', estacionamento.name);

  // -----------------------------------------------------------
  // Gera as vagas para cada andar e setor
  // Configuração: 3 andares × 2 setores (A e B) × 20 vagas = 120
  // -----------------------------------------------------------
  const vagas = [];
  const setores = ['A', 'B'];
  let contadorVaga = 0;

  for (let andar = 1; andar <= 3; andar++) {
    for (const setor of setores) {
      for (let numero = 1; numero <= 20; numero++) {
        // Define o tipo de vaga baseado em regras de negócio
        let tipo: SpotType = SpotType.STANDARD;

        // Vagas 1 e 2 de cada setor no andar 1 são PCD
        if (andar === 1 && numero <= 2) {
          tipo = SpotType.DISABLED;
        }
        // Vagas 19 e 20 de cada setor são VIP
        else if (numero >= 19) {
          tipo = SpotType.VIP;
        }

        // Calcula coordenadas para o mapa SVG (grid de vagas)
        // Cada vaga ocupa 60x40 pixels no SVG
        const coordX = (numero - 1) * 65;
        const coordY = setores.indexOf(setor) * 80;

        vagas.push({
          lotId: estacionamento.id,
          floor: andar,
          sector: setor,
          number: numero,
          status: SpotStatus.FREE, // Todas começam livres
          type: tipo,
          coordX,
          coordY,
        });

        contadorVaga++;
      }
    }
  }

  // Insere todas as vagas de uma vez (mais eficiente)
  await prisma.spot.createMany({ data: vagas });
  console.log(`✅ ${contadorVaga} vagas criadas em 3 andares`);

  // -----------------------------------------------------------
  // Busca as vagas criadas para usar nos dados de sessão
  // -----------------------------------------------------------
  const vagasCriadas = await prisma.spot.findMany({
    where: { lotId: estacionamento.id },
    orderBy: [{ floor: 'asc' }, { sector: 'asc' }, { number: 'asc' }],
  });

  // -----------------------------------------------------------
  // Cria sessões CONCLUÍDAS (histórico dos últimos 7 dias)
  // Simula um dia movimentado com 30 sessões já encerradas
  // -----------------------------------------------------------
  const agora = new Date();
  const sessoesParaCriar = [];
  const pagamentosParaCriar = [];

  // Pares de motorista → veículo para as sessões
  const motoristas = [
    { userId: motorista.id,    veiculos: await prisma.vehicle.findMany({ where: { userId: motorista.id } }) },
    { userId: motoristaPcd.id, veiculos: await prisma.vehicle.findMany({ where: { userId: motoristaPcd.id } }) },
  ];

  // Dados realistas: sessões dos últimos 7 dias em horários variados
  const configuracoesSessao = [
    { diasAtras: 0, horaEntrada: 8,  duracaoMin: 90  },
    { diasAtras: 0, horaEntrada: 9,  duracaoMin: 120 },
    { diasAtras: 0, horaEntrada: 10, duracaoMin: 45  },
    { diasAtras: 0, horaEntrada: 11, duracaoMin: 200 },
    { diasAtras: 0, horaEntrada: 14, duracaoMin: 75  },
    { diasAtras: 0, horaEntrada: 15, duracaoMin: 160 },
    { diasAtras: 1, horaEntrada: 9,  duracaoMin: 110 },
    { diasAtras: 1, horaEntrada: 10, duracaoMin: 95  },
    { diasAtras: 1, horaEntrada: 13, duracaoMin: 240 },
    { diasAtras: 1, horaEntrada: 16, duracaoMin: 60  },
    { diasAtras: 2, horaEntrada: 8,  duracaoMin: 180 },
    { diasAtras: 2, horaEntrada: 11, duracaoMin: 130 },
    { diasAtras: 2, horaEntrada: 14, duracaoMin: 90  },
    { diasAtras: 3, horaEntrada: 9,  duracaoMin: 75  },
    { diasAtras: 3, horaEntrada: 10, duracaoMin: 210 },
    { diasAtras: 4, horaEntrada: 8,  duracaoMin: 120 },
    { diasAtras: 4, horaEntrada: 12, duracaoMin: 150 },
    { diasAtras: 5, horaEntrada: 10, duracaoMin: 80  },
    { diasAtras: 5, horaEntrada: 14, duracaoMin: 100 },
    { diasAtras: 6, horaEntrada: 9,  duracaoMin: 190 },
    { diasAtras: 6, horaEntrada: 15, duracaoMin: 65  },
  ];

  const preco = Number(estacionamento.pricePerHour);
  const metodosRotacao: ('PIX' | 'CREDIT' | 'DEBIT')[] = ['PIX', 'PIX', 'CREDIT', 'PIX', 'DEBIT', 'CREDIT', 'PIX'];

  for (let i = 0; i < configuracoesSessao.length; i++) {
    const cfg    = configuracoesSessao[i];
    const vaga   = vagasCriadas[i % 30]; // usa as primeiras 30 vagas
    const mot    = motoristas[i % 2];
    const veiculo = mot.veiculos[0];
    if (!veiculo) continue;

    // Calcula horários da sessão
    const entrada = new Date(agora);
    entrada.setDate(entrada.getDate() - cfg.diasAtras);
    entrada.setHours(cfg.horaEntrada, Math.floor(Math.random() * 59), 0, 0);

    const saida = new Date(entrada);
    saida.setMinutes(saida.getMinutes() + cfg.duracaoMin);

    // Tarifa: mínimo 1 hora, + 20% se ocupação > 80% (simulado ocasionalmente)
    const horas = Math.max(cfg.duracaoMin / 60, 1);
    const fatorDinamico = i % 5 === 0 ? 1.2 : 1.0;
    const valor = parseFloat((horas * preco * fatorDinamico).toFixed(2));

    const metodo = metodosRotacao[i % metodosRotacao.length];

    sessoesParaCriar.push({
      idx: i,
      vehicleId:    veiculo.id,
      spotId:       vaga.id,
      entryAt:      entrada,
      exitAt:       saida,
      totalMinutes: cfg.duracaoMin,
      totalAmount:  valor,
      status:       'COMPLETED' as const,
      metodo,
      valor,
    });
  }

  // Insere sessões uma por uma (para pegar os IDs e criar pagamentos)
  let sessoesCriadas = 0;
  let pagamentosCriados = 0;
  let receitaTotal = 0;

  for (const s of sessoesParaCriar) {
    const sessao = await prisma.session.create({
      data: {
        vehicleId:    s.vehicleId,
        spotId:       s.spotId,
        entryAt:      s.entryAt,
        exitAt:       s.exitAt,
        totalMinutes: s.totalMinutes,
        totalAmount:  s.totalAmount,
        status:       s.status,
      },
    });

    // Cria o pagamento aprovado para a sessão
    const paidAt = new Date(s.exitAt!);
    paidAt.setMinutes(paidAt.getMinutes() + 5); // pago ~5 min após saída

    await prisma.payment.create({
      data: {
        sessionId:   sessao.id,
        amount:      s.valor,
        method:      s.metodo,
        status:      'APPROVED',
        mpPaymentId: `MP_DEMO_${sessao.id.slice(-8).toUpperCase()}`,
        paidAt,
      },
    });

    sessoesCriadas++;
    pagamentosCriados++;
    receitaTotal += s.valor;
  }

  console.log(`✅ ${sessoesCriadas} sessões concluídas criadas`);
  console.log(`✅ ${pagamentosCriados} pagamentos aprovados (R$ ${receitaTotal.toFixed(2)} total)`);

  // -----------------------------------------------------------
  // Marca algumas vagas como OCUPADAS (sessões ativas agora)
  // Simula ~40% de ocupação no momento atual
  // -----------------------------------------------------------
  const vagasParaOcupar = vagasCriadas
    .filter((v) => v.type === 'STANDARD')
    .slice(0, 48); // ~40% de 120

  const idsParaOcupar = vagasParaOcupar.map((v) => v.id);

  await prisma.spot.updateMany({
    where: { id: { in: idsParaOcupar } },
    data:  { status: SpotStatus.OCCUPIED },
  });

  // Cria sessões ativas para as vagas ocupadas
  const veiculoMotorista  = (await prisma.vehicle.findFirst({ where: { userId: motorista.id    } }))!;
  const veiculoPcd        = (await prisma.vehicle.findFirst({ where: { userId: motoristaPcd.id } }))!;

  for (let i = 0; i < vagasParaOcupar.length; i++) {
    const veiculo  = i % 2 === 0 ? veiculoMotorista : veiculoPcd;
    const horasAtras = 0.5 + (i % 3) * 0.5; // 0.5 a 1.5 horas atrás
    const entradaAtiva = new Date(agora.getTime() - horasAtras * 3600 * 1000);

    await prisma.session.create({
      data: {
        vehicleId: veiculo.id,
        spotId:    vagasParaOcupar[i].id,
        entryAt:   entradaAtiva,
        status:    'ACTIVE',
      },
    });
  }

  console.log(`✅ ${vagasParaOcupar.length} vagas ocupadas com sessões ativas`);

  // -----------------------------------------------------------
  // Resumo final
  // -----------------------------------------------------------
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Logins disponíveis (senha: Senha@123)');
  console.log('   Motorista:  joao@parkme.com');
  console.log('   Motorista PCD: maria@parkme.com');
  console.log('   Operador:   operador@parkme.com');
  console.log('   Admin:      admin@parkme.com');
  console.log('🏢 Estacionamento: ParkMe Shopping Center');
  console.log(`   Andares: 3 | Vagas: 120 | R$ 15,00/h`);
  console.log(`   Ocupação atual: ~40% (${vagasParaOcupar.length} vagas)`);
  console.log(`   Receita demo: R$ ${receitaTotal.toFixed(2)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Executa o seed e trata erros
main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Sempre desconecta do banco ao terminar
    await prisma.$disconnect();
  });
