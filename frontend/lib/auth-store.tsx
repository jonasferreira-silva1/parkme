// =============================================================
// AUTH STORE — Estado global de autenticação (React Context)
//
// Mantém o usuário logado em memória para que Sidebar, Topbar
// e outros componentes acessem sem consultar o localStorage
// a cada render.
// =============================================================

"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import {
  getUsuario,
  saveUsuario,
  saveTokens,
  clearTokens,
  estaAutenticado,
  type Usuario,
} from "./auth"
import api from "./api"

interface AuthContextType {
  usuario:     Usuario | null
  carregando:  boolean
  // Salva os dados após login bem-sucedido
  login:  (usuario: Usuario, accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  usuario:    null,
  carregando: true,
  login:      () => {},
  logout:     () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario]       = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Restaura o usuário do localStorage ao montar o provider
  useEffect(() => {
    if (estaAutenticado()) {
      const salvo = getUsuario()
      if (salvo) {
        setUsuario(salvo)
      }
    }
    setCarregando(false)
  }, [])

  const login = (novoUsuario: Usuario, accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken)
    saveUsuario(novoUsuario)

    // Define o cookie de sinalização para o middleware
    document.cookie = "parkme_auth=1; path=/; max-age=604800; SameSite=Lax"

    setUsuario(novoUsuario)
  }

  const logout = () => {
    clearTokens()

    // Remove o cookie de sinalização
    document.cookie = "parkme_auth=; path=/; max-age=0"

    setUsuario(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook para acessar o estado de autenticação em qualquer componente */
export function useAuth() {
  return useContext(AuthContext)
}
