// =============================================================
// PARKING GATEWAY — Servidor WebSocket em tempo real
//
// Permite que o app mobile receba atualizações instantâneas
// quando uma vaga muda de status, sem precisar ficar consultando
// a API o tempo todo (polling).
//
// Como usar no cliente (React Native):
//   const socket = io('http://localhost:3000/parking');
//   socket.emit('entrar_estacionamento', { lotId: 'xxx' });
//   socket.on('vaga_ocupada', (data) => atualizarMapa(data));
// =============================================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Configura o Gateway no namespace /parking
// CORS liberado para o app mobile e web
@WebSocketGateway({
  namespace: '/parking',
  cors: {
    origin: '*', // Em produção, especifique os domínios permitidos
    methods: ['GET', 'POST'],
  },
})
export class ParkingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ParkingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Chamado quando um cliente conecta e valida o token JWT
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        this.logger.warn(
          `📱 Conexão WebSocket sem token rejeitada: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Anexa os dados do usuário ao client socket para uso posterior nas rotas
      client.data = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      this.logger.log(
        `📱 Cliente conectado e autenticado: ${payload.email} (${client.id})`,
      );
    } catch (err) {
      this.logger.warn(
        `📱 Falha na autenticação do socket ${client.id}: ${err.message}`,
      );
      client.disconnect();
    }
  }

  // Chamado quando um cliente desconecta
  handleDisconnect(client: Socket) {
    this.logger.log(`📴 Cliente desconectado: ${client.id}`);
  }

  // -----------------------------------------------------------
  // O cliente entra na "sala" do estacionamento.
  // Assim só recebe eventos do estacionamento em que está.
  // -----------------------------------------------------------
  @SubscribeMessage('entrar_estacionamento')
  entrarEstacionamento(
    @MessageBody() data: { lotId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Sai de salas anteriores antes de entrar na nova
    client.rooms.forEach((sala) => {
      if (sala !== client.id) client.leave(sala);
    });

    // Entra na sala do estacionamento específico
    const sala = `lot_${data.lotId}`;
    client.join(sala);

    this.logger.log(`📍 ${client.id} entrou na sala ${sala}`);

    // Confirma ao cliente que entrou com sucesso
    return { evento: 'sala_confirmada', sala };
  }

  // -----------------------------------------------------------
  // MÉTODOS PÚBLICOS — Chamados por outros services ao mudar estado
  // -----------------------------------------------------------

  /**
   * Notifica TODOS os clientes de um estacionamento que uma vaga foi ocupada.
   * Chamado pelo SessionsService quando um carro entra.
   */
  emitirVagaOcupada(
    lotId: string,
    vaga: {
      spotId: string;
      floor: number;
      sector: string;
      number: number;
    },
  ) {
    this.server.to(`lot_${lotId}`).emit('vaga_ocupada', vaga);
    this.logger.debug(`📢 vaga_ocupada emitido para lot_${lotId}`);
  }

  /**
   * Notifica que uma vaga foi liberada.
   * Chamado pelo PaymentsService após confirmar o pagamento.
   */
  emitirVagaLivre(
    lotId: string,
    vaga: {
      spotId: string;
      floor: number;
      sector: string;
      number: number;
    },
  ) {
    this.server.to(`lot_${lotId}`).emit('vaga_livre', vaga);
    this.logger.debug(`📢 vaga_livre emitido para lot_${lotId}`);
  }

  /**
   * Avisa o usuário específico que sua sessão está prestes a vencer.
   * Chamado pelo BullMQ worker 15 minutos antes do vencimento.
   */
  emitirSessaoExpirando(
    userId: string,
    dados: {
      sessionId: string;
      minutesLeft: number;
      totalAmount: number;
    },
  ) {
    // Emite para o room privado do usuário (userId como nome da sala)
    this.server.to(`user_${userId}`).emit('sessao_expirando', dados);
  }

  /**
   * Broadcast de ocupação do estacionamento a cada 30 segundos.
   * Chamado por um job periódico (cron).
   */
  emitirOcupacaoGeral(
    lotId: string,
    dados: {
      total: number;
      ocupadas: number;
      percentual: number;
    },
  ) {
    this.server.to(`lot_${lotId}`).emit('ocupacao_geral', dados);
  }

  // TODO: Consistência de Nomenclatura — Eventos WS e salas privadas usam português
  // (ex: entrar_sala_usuario, vaga_ocupada) enquanto rotas REST e DB usam inglês (ex: spots, sessions).
  // Manter por ora para evitar quebras de integração com o aplicativo móvel existente.
  //
  // O cliente entra no seu room privado para receber alertas pessoais
  // Ignora o parâmetro vindo do cliente e usa o userId validado do JWT para segurança
  @SubscribeMessage('entrar_sala_usuario')
  entrarSalaUsuario(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId;
    if (!userId) {
      this.logger.warn(
        `Tentativa de entrar na sala de usuário sem autenticação: ${client.id}`,
      );
      return { evento: 'erro', mensagem: 'Não autenticado' };
    }
    client.join(`user_${userId}`);
    this.logger.log(`👤 ${client.id} entrou na sala privada user_${userId}`);
    return { evento: 'sala_usuario_confirmada' };
  }
}
