// =============================================================
// SESSION STORE — Estado da sessão ativa do motorista
// =============================================================

import { create } from 'zustand';

export interface SessaoAtiva {
  id: string;
  entryAt: string;
  spot: {
    id: string;
    floor: number;
    sector: string;
    number: number;
    lot: { name: string; pricePerHour: number };
  };
  vehicle: {
    plate: string;
    model: string;
    color: string;
  };
}

interface SessionStore {
  sessao: SessaoAtiva | null;
  setSessao: (sessao: SessaoAtiva | null) => void;

  // Calcula os minutos decorridos desde a entrada
  minutosDecorridos: () => number;

  // Calcula o valor atual (sem preço dinâmico, para exibição)
  valorEstimado: () => number;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessao: null,

  setSessao: (sessao) => set({ sessao }),

  minutosDecorridos: () => {
    const { sessao } = get();
    if (!sessao) return 0;

    const agora = new Date().getTime();
    const entrada = new Date(sessao.entryAt).getTime();
    return Math.floor((agora - entrada) / 60000);
  },

  valorEstimado: () => {
    const { sessao, minutosDecorridos } = get();
    if (!sessao) return 0;

    const minutos = minutosDecorridos();
    const horas = Math.max(minutos / 60, 1);
    const valor = horas * sessao.spot.lot.pricePerHour;
    return parseFloat(valor.toFixed(2));
  },
}));
