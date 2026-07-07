// =============================================================
// API SERVICE — Cliente HTTP centralizado (Axios)
//
// Todas as chamadas à API passam por aqui.
// Benefícios:
//   - URL base em um só lugar
//   - Token JWT adicionado automaticamente em cada request
//   - Refresh automático do token quando expirar (401)
// =============================================================

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL da API obtida dinamicamente da variável de ambiente EXPO_PUBLIC_API_URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

// Chaves para guardar os tokens no armazenamento seguro do dispositivo
const CHAVE_ACCESS_TOKEN  = 'parkme_access_token';
const CHAVE_REFRESH_TOKEN = 'parkme_refresh_token';

// Cria a instância do Axios com configurações padrão
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos — se demorar mais, cancela
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// -----------------------------------------------------------
// INTERCEPTOR DE REQUEST — Adiciona o token JWT em toda requisição
// -----------------------------------------------------------
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(CHAVE_ACCESS_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// -----------------------------------------------------------
// INTERCEPTOR DE RESPONSE — Renova token automaticamente ao receber 401
// -----------------------------------------------------------
let estaRenovandoToken = false; // Evita múltiplas renovações simultâneas

api.interceptors.response.use(
  // Se a resposta for OK, apenas retorna
  (response) => response,

  // Se der erro, verifica se é 401 (token expirado)
  async (error: AxiosError) => {
    const requestOriginal = error.config as any;

    if (error.response?.status === 401 && !requestOriginal._renovacaoTentada) {
      requestOriginal._renovacaoTentada = true;

      if (!estaRenovandoToken) {
        estaRenovandoToken = true;

        try {
          const refreshToken = await SecureStore.getItemAsync(CHAVE_REFRESH_TOKEN);

          if (refreshToken) {
            // Chama o endpoint de renovação com o refresh token
            const resposta = await axios.post(`${API_URL}/auth/refresh`, null, {
              headers: { Authorization: `Bearer ${refreshToken}` },
            });

            const { accessToken, refreshToken: novoRefreshToken } = resposta.data;

            // Salva os novos tokens
            await salvarTokens(accessToken, novoRefreshToken);

            // Repete a requisição original com o novo token
            requestOriginal.headers.Authorization = `Bearer ${accessToken}`;
            return api(requestOriginal);
          }
        } catch {
          // Se não conseguiu renovar, força o logout
          await limparTokens();
        } finally {
          estaRenovandoToken = false;
        }
      }
    }

    return Promise.reject(error);
  },
);

// -----------------------------------------------------------
// FUNÇÕES AUXILIARES — Gerenciar tokens no armazenamento seguro
// -----------------------------------------------------------

/** Salva os tokens JWT no armazenamento seguro do dispositivo */
export async function salvarTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(CHAVE_ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(CHAVE_REFRESH_TOKEN, refreshToken),
  ]);
}

/** Remove os tokens (logout) */
export async function limparTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(CHAVE_ACCESS_TOKEN),
    SecureStore.deleteItemAsync(CHAVE_REFRESH_TOKEN),
  ]);
}

/** Verifica se o usuário está autenticado (tem access token) */
export async function estaAutenticado(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(CHAVE_ACCESS_TOKEN);
  return !!token;
}

export default api;
