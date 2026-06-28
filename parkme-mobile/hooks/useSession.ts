// =============================================================
// useSession — Hook para gerenciar a sessão ativa do motorista
// Carrega a sessão da API e mantém o countdown atualizado.
// =============================================================

import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useSessionStore } from '../store/sessionStore';

export function useSession() {
  const { sessao, setSessao, minutosDecorridos, valorEstimado } = useSessionStore();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Timer para atualizar o countdown a cada minuto
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Busca a sessão ativa na API
  const carregarSessao = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await api.get('/sessions/active');
      setSessao(resposta.data);
    } catch (e: any) {
      if (e.response?.status === 404) {
        setSessao(null); // Sem sessão ativa — normal
      } else {
        setErro('Erro ao carregar sessão');
      }
    } finally {
      setCarregando(false);
    }
  };

  // Registra a entrada do veículo
  const registrarEntrada = async (vehicleId: string, lotId: string) => {
    setCarregando(true);
    try {
      const resposta = await api.post('/sessions/entry', { vehicleId, lotId });
      setSessao(resposta.data);
      return resposta.data;
    } finally {
      setCarregando(false);
    }
  };

  // Registra a saída e retorna o valor calculado
  const registrarSaida = async () => {
    if (!sessao) throw new Error('Sem sessão ativa');
    setCarregando(true);

    try {
      const resposta = await api.post(`/sessions/${sessao.id}/exit`);
      setSessao(null);
      return resposta.data;
    } finally {
      setCarregando(false);
    }
  };

  // Carrega a sessão ao montar o hook
  useEffect(() => {
    carregarSessao();
  }, []);

  // Inicia o timer de atualização quando há sessão ativa
  useEffect(() => {
    if (sessao) {
      // Atualiza o componente a cada minuto para o countdown
      intervalRef.current = setInterval(() => {
        // O Zustand re-renderiza automaticamente ao chamar o getter
        useSessionStore.setState({});
      }, 60000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessao?.id]);

  return {
    sessao,
    carregando,
    erro,
    minutosDecorridos: minutosDecorridos(),
    valorEstimado: valorEstimado(),
    carregarSessao,
    registrarEntrada,
    registrarSaida,
  };
}
