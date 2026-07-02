// =============================================================
// MIDDLEWARE — Proteção de rotas do dashboard
//
// Verifica se há um token salvo antes de permitir o acesso.
// Redireciona para /login se não autenticado.
//
// Nota: o middleware do Next.js roda no Edge Runtime e não
// tem acesso ao localStorage. Por isso usamos um cookie
// "parkme_auth" definido em client-side como sinalização.
// A validação real do JWT acontece na API a cada request.
// =============================================================

import { NextResponse, type NextRequest } from "next/server"

// Rotas públicas — não requerem autenticação
const ROTAS_PUBLICAS = ["/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar rotas públicas e arquivos estáticos
  const ehPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r))
  const ehEstatico = pathname.startsWith("/_next") || pathname.startsWith("/favicon")

  if (ehPublica || ehEstatico) {
    return NextResponse.next()
  }

  // Verifica o cookie de sinalização de autenticação
  // (o client-side define "parkme_auth=1" após login bem-sucedido)
  const authCookie = request.cookies.get("parkme_auth")

  if (!authCookie?.value) {
    // Salva a URL original para redirecionar após login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Aplica o middleware em todas as rotas exceto API routes e estáticos
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder).*)"],
}
