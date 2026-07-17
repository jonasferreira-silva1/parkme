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
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import {
  salvarTokens,
  limparTokens,
  CHAVE_ACCESS_TOKEN,
  CHAVE_REFRESH_TOKEN,
} from './token';

// URL da API obtida dinamicamente da variável de ambiente EXPO_PUBLIC_API_URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

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
async function forcarLogout() {
  await limparTokens();
  try {
    await useAuthStore.getState().logout();
    router.replace('/(auth)/login');
  } catch (e) {
    console.error('Erro ao forçar logout:', e);
  }
}

let estaRenovandoToken = false; // Evita múltiplas renovações simultâneas

api.interceptors.response.use(
  // Se a resposta for OK, apenas retorna
  (response) => response,

  // Se der erro, verifica se é 401 (token expirado)
  async (error: AxiosError) => {
    const requestOriginal = error.config as any;

    if (error.response?.status === 401) {
      if (!requestOriginal._renovacaoTentada) {
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
              estaRenovandoToken = false;
              return api(requestOriginal);
            } else {
              throw new Error('Sem refresh token');
            }
          } catch {
            estaRenovandoToken = false;
            await forcarLogout();
          }
        }
      } else {
        // Se já tentou renovar e deu 401 de novo, o token novo também é inválido
        await forcarLogout();
      }
    }

    return Promise.reject(error);
  },
);

export default api;

