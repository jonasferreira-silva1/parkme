// =============================================================
// AUTH — Funções de autenticação para o dashboard web
//
// Tokens são armazenados no localStorage (acesso client-side).
// O usuário logado é persistido em JSON para evitar chamadas
// desnecessárias à API a cada render.
// =============================================================

const CHAVE_ACCESS  = "parkme_access_token"
const CHAVE_REFRESH = "parkme_refresh_token"
const CHAVE_USUARIO = "parkme_usuario"

// Tipo do usuário autenticado (espelha o retorno de /auth/login)
export interface Usuario {
  id:    string
  name:  string
  email: string
  role:  "DRIVER" | "OPERATOR" | "ADMIN"
}

// -----------------------------------------------------------
// Tokens
// -----------------------------------------------------------

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CHAVE_ACCESS)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CHAVE_REFRESH)
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(CHAVE_ACCESS, accessToken)
  localStorage.setItem(CHAVE_REFRESH, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(CHAVE_ACCESS)
  localStorage.removeItem(CHAVE_REFRESH)
  localStorage.removeItem(CHAVE_USUARIO)
}

// -----------------------------------------------------------
// Usuário
// -----------------------------------------------------------

export function saveUsuario(usuario: Usuario): void {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function getUsuario(): Usuario | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(CHAVE_USUARIO)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

// -----------------------------------------------------------
// Verificações
// -----------------------------------------------------------

/** Retorna true se há um access token salvo (não valida expiração) */
export function estaAutenticado(): boolean {
  return Boolean(getAccessToken())
}

/** Retorna true se o usuário tem permissão de operador ou admin */
export function isOperadorOuAdmin(): boolean {
  const usuario = getUsuario()
  return usuario?.role === "OPERATOR" || usuario?.role === "ADMIN"
}
