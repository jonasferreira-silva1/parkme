// =============================================================
// API CLIENT — Cliente HTTP centralizado (Axios)
//
// Responsabilidades:
//   - Aponta para a API NestJS via variável de ambiente
//   - Injeta o JWT em toda requisição automaticamente
//   - Renova o access token via refresh token ao receber 401
//   - Força logout se o refresh também falhar
// =============================================================

import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from "axios"
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

// Instância principal — usada em toda a aplicação
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// -----------------------------------------------------------
// INTERCEPTOR DE REQUEST — injeta o Bearer token em toda chamada
// -----------------------------------------------------------
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Só injetamos token no browser (não em SSR)
    if (typeof window !== "undefined") {
      const token = getAccessToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Evita múltiplas renovações simultâneas em caso de race condition
let renovando = false

// -----------------------------------------------------------
// INTERCEPTOR DE RESPONSE — renova token ao receber 401
// -----------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const original = error.config as any

    if (error.response?.status === 401 && !original._renovacaoTentada) {
      original._renovacaoTentada = true

      if (!renovando) {
        renovando = true

        try {
          const refreshToken = getRefreshToken()

          if (refreshToken) {
            // Chama o endpoint de refresh sem passar pelo interceptor (evita loop)
            const resposta = await axios.post(
              `${API_URL}/auth/refresh`,
              null,
              { headers: { Authorization: `Bearer ${refreshToken}` } },
            )

            const { accessToken, refreshToken: novoRefresh } = resposta.data
            saveTokens(accessToken, novoRefresh)

            // Reenvia a requisição original com o novo token
            original.headers.Authorization = `Bearer ${accessToken}`
            return api(original)
          }
        } catch {
          // Refresh falhou — força logout e redireciona para o login
          clearTokens()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        } finally {
          renovando = false
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
