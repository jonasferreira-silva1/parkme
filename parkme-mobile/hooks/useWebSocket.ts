// =============================================================
// useWebSocket — Hook que conecta ao WebSocket e atualiza o mapa
//
// Uso: chame este hook na tela Home quando o mapa estiver visível.
// Ele gerencia a conexão, eventos e limpeza automaticamente.
// =============================================================

import { useEffect, useCallback } from 'react';
import { getSocket, entrarEstacionamento, entrarSalaUsuario } from '../services/socket';
import { useParkingStore } from '../store/parkingStore';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';

interface OpcoesWebSocket {
  lotId: string;       // ID do estacionamento para entrar na sala certa
  onSessaoExpirando?: (dados: { minutesLeft: number; totalAmount: number }) => void;
}

export function useWebSocket({ lotId, onSessaoExpirando }: OpcoesWebSocket) {
  const { atualizarVaga, setTaxaOcupacao } = useParkingStore();
  const { setSessao } = useSessionStore();
  const { usuario } = useAuthStore();

  // Conecta ao WebSocket e registra os listeners de eventos
  const conectar = useCallback(async () => {
    const socket = await getSocket();

    // Entra na sala do estacionamento (recebe eventos de vagas)
    await entrarEstacionamento(lotId);

    // Entra na sala privada do usuário (recebe alertas pessoais)
    if (usuario?.id) {
      await entrarSalaUsuario(usuario.id);
    }

    // --- Evento: vaga foi ocupada ---
    socket.on('vaga_ocupada', (data: { spotId: string }) => {
      atualizarVaga(data.spotId, 'OCCUPIED');
    });

    // --- Evento: vaga foi liberada ---
    socket.on('vaga_livre', (data: { spotId: string }) => {
      atualizarVaga(data.spotId, 'FREE');
    });

    // --- Evento: sessão do usuário está expirando ---
    socket.on('sessao_expirando', (dados) => {
      onSessaoExpirando?.(dados);
    });

    // --- Evento: atualização geral de ocupação (a cada 30s) ---
    socket.on('ocupacao_geral', (dados: { percentual: number }) => {
      setTaxaOcupacao(dados.percentual);
    });
  }, [lotId, usuario?.id]);

  useEffect(() => {
    conectar();

    // Limpeza: remove os listeners quando o componente é desmontado
    return () => {
      getSocket().then((socket) => {
        socket.off('vaga_ocupada');
        socket.off('vaga_livre');
        socket.off('sessao_expirando');
        socket.off('ocupacao_geral');
      });
    };
  }, [conectar]);
}
