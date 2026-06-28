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
  console.log('   Andares: 3 | Vagas: 120 | R$ 15,00/h');
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
