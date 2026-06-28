// =============================================================
// PARKING STORE — Estado das vagas do estacionamento (Zustand)
//
// Mantém o mapa de vagas atualizado em tempo real.
// Quando o WebSocket emite 'vaga_ocupada' ou 'vaga_livre',
// este store é atualizado e o mapa redesenha automaticamente.
// =============================================================

import { create } from 'zustand';

// Tipo de uma vaga individual
export interface Vaga {
  id: string;
  floor: number;
  sector: string;
  number: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  type: 'STANDARD' | 'DISABLED' | 'VIP';
  coordX: number;
  coordY: number;
}

interface ParkingStore {
  vagas: Vaga[];
  andarAtual: number;
  taxaOcupacao: number;         // 0–100 (porcentagem)
  carregando: boolean;

  // Define todas as vagas (chamado ao carregar o mapa)
  setVagas: (vagas: Vaga[]) => void;

  // Atualiza o status de uma vaga específica (chamado pelo WebSocket)
  atualizarVaga: (spotId: string, status: Vaga['status']) => void;

  // Muda o andar visível no mapa
  setAndar: (andar: number) => void;

  // Atualiza a taxa de ocupação geral
  setTaxaOcupacao: (taxa: number) => void;

  setCarregando: (valor: boolean) => void;

  // Retorna vagas filtradas pelo andar atual
  vagasDoAndar: (andar: number) => Vaga[];
}

export const useParkingStore = create<ParkingStore>((set, get) => ({
  vagas: [],
  andarAtual: 1,
  taxaOcupacao: 0,
  carregando: false,

  setVagas: (vagas) => set({ vagas }),

  // Atualização imutável: cria novo array com a vaga alterada
  atualizarVaga: (spotId, status) =>
    set((state) => ({
      vagas: state.vagas.map((v) =>
        v.id === spotId ? { ...v, status } : v,
      ),
    })),

  setAndar: (andar) => set({ andarAtual: andar }),

  setTaxaOcupacao: (taxa) => set({ taxaOcupacao: taxa }),

  setCarregando: (carregando) => set({ carregando }),

  // Getter computado — filtra vagas por andar
  vagasDoAndar: (andar) => get().vagas.filter((v) => v.floor === andar),
}));
