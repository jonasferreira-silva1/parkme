// =============================================================
// SOCKET — Cliente WebSocket singleton (Socket.io)
//
// Gerencia uma única conexão com o gateway /parking da API.
// Reutiliza a conexão existente em vez de criar múltiplas.
// O JWT é enviado no handshake para autenticar o cliente.
// =============================================================

import { io, type Socket } from "socket.io-client"
import { getAccessToken } from "./auth"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000"

// Instância única — padrão Singleton
let socket: Socket | null = null

/**
 * Retorna a conexão WebSocket, criando uma nova se necessário.
 * Só funciona no browser (not SSR).
 */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("WebSocket só pode ser usado no browser")
  }

  if (socket?.connected) {
    return socket
  }

  const token = getAccessToken()

  socket = io(`${WS_URL}/parking`, {
    auth:       { token },          // JWT enviado no handshake
    transports: ["websocket"],       // Sem polling — conexão direta
    reconnection:         true,
    reconnectionAttempts: 10,
    reconnectionDelay:    2000,
  })

  if (process.env.NODE_ENV === "development") {
    socket.on("connect",       ()      => console.log("🔌 WS conectado:", socket?.id))
    socket.on("disconnect",    (r)     => console.log("📴 WS desconectado:", r))
    socket.on("connect_error", (err)   => console.warn("❌ WS erro:", err.message))
  }

  return socket
}

/** Entra na sala do estacionamento para receber atualizações de vagas */
export function entrarEstacionamento(lotId: string) {
  const s = getSocket()
  s.emit("entrar_estacionamento", { lotId })
}

/** Entra na sala privada do usuário para receber alertas pessoais */
export function entrarSalaUsuario(userId: string) {
  const s = getSocket()
  s.emit("entrar_sala_usuario", { userId })
}

/** Desconecta e limpa a instância (chamado no logout) */
export function desconectarSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
