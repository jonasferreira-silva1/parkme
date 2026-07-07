// =============================================================
// SOCKET SERVICE — Conexão WebSocket com o backend
//
// Gerencia a conexão única com o servidor Socket.io.
// Padrão Singleton: cria uma conexão e reutiliza em todo o app.
// =============================================================

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

// Mesma URL da API obtida dinamicamente da variável de ambiente EXPO_PUBLIC_API_URL
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

// Instância única do socket (singleton)
let socket: Socket | null = null;

/**
 * Retorna a conexão WebSocket, criando uma nova se necessário.
 * O token JWT é enviado no handshake para autenticar o usuário.
 */
export async function getSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket; // Reutiliza conexão existente
  }

  const token = await SecureStore.getItemAsync('parkme_access_token');

  socket = io(`${SOCKET_URL}/parking`, {
    auth: { token },          // Envia o JWT na conexão
    transports: ['websocket'], // Força WebSocket (sem polling)
    reconnection: true,        // Tenta reconectar automaticamente
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  // Log de conexão (apenas em desenvolvimento)
  if (__DEV__) {
    socket.on('connect', () => console.log('🔌 WebSocket conectado'));
    socket.on('disconnect', (reason) => console.log('📴 WebSocket desconectado:', reason));
    socket.on('connect_error', (err) => console.log('❌ Erro WebSocket:', err.message));
  }

  return socket;
}

/**
 * Entra na sala do estacionamento para receber atualizações
 * de vagas em tempo real.
 */
export async function entrarEstacionamento(lotId: string) {
  const s = await getSocket();
  s.emit('entrar_estacionamento', { lotId });
}

/**
 * Entra na sala privada do usuário para receber alertas pessoais
 * (ex: sessão expirando).
 */
export async function entrarSalaUsuario(userId: string) {
  const s = await getSocket();
  s.emit('entrar_sala_usuario', { userId });
}

/** Desconecta e limpa o socket (usado no logout) */
export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
