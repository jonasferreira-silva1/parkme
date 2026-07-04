// =============================================================
// MIDDLEWARE — Proteção de rotas
//
// Rotas públicas: /login (operador) e /admin/login (admin)
// Todas as outras exigem o cookie parkme_auth.
//
// Regra adicional: /admin/* exige role ADMIN.
// A verificação de role fina é feita no client via useAuth,
// já que o middleware Edge Runtime não tem acesso ao JWT completo.
// =============================================================

import { NextResponse, type NextRequest } from "next/server"

const ROTAS_PUBLICAS = ["/login", "/admin/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar rotas públicas e arquivos estáticos
  const ehPublica  = ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(r + "?"))
  const ehEstatico = pathname.startsWith("/_next") || pathname.startsWith("/favicon") ||
                     pathname.startsWith("/icon")  || pathname.startsWith("/apple-icon") ||
                     pathname.startsWith("/placeholder")

  if (ehPublica || ehEstatico) return NextResponse.next()

  // Verifica cookie de autenticação
  const authCookie = request.cookies.get("parkme_auth")

  if (!authCookie?.value) {
    // Rotas admin não autenticadas → login admin
    const destino = pathname.startsWith("/admin") ? "/admin/login" : "/login"
    const url = new URL(destino, request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder).*)"],
}
