// =============================================================
// AUTH STORE — Estado global de autenticação (Zustand)
//
// Zustand é mais simples que Redux mas igualmente poderoso.
// Armazena: usuário logado, tokens e funções de login/logout.
// =============================================================

import { create } from 'zustand';
import { salvarTokens, limparTokens } from '../services/token';
import { desconectarSocket } from '../services/socket';

// Tipo do usuário autenticado
interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Formato do estado e ações do store
interface AuthStore {
  usuario: Usuario | null;
  estaLogado: boolean;

  // Ação chamada após login bem-sucedido
  login: (usuario: Usuario, accessToken: string, refreshToken: string) => Promise<void>;

  // Ação de logout — limpa tudo
  logout: () => Promise<void>;

  // Atualiza dados do usuário (ex: após editar perfil)
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  estaLogado: false,

  login: async (usuario, accessToken, refreshToken) => {
    // Salva os tokens de forma segura no dispositivo
    await salvarTokens(accessToken, refreshToken);

    // Atualiza o estado global
    set({ usuario, estaLogado: true });
  },

  logout: async () => {
    // Remove tokens do armazenamento seguro
    await limparTokens();

    // Desconecta o WebSocket
    desconectarSocket();

    // Limpa o estado
    set({ usuario: null, estaLogado: false });
  },

  atualizarUsuario: (dados) => {
    set((state) => ({
      usuario: state.usuario ? { ...state.usuario, ...dados } : null,
    }));
  },
}));
