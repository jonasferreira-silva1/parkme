// =============================================================
// ADMIN DASHBOARD — Redireciona para a visão geral
// A diferenciação de conteúdo é feita pela role no sidebar.
// Na Parte 4 será expandido com páginas específicas do admin.
// =============================================================

import { redirect } from "next/navigation"

export default function AdminPage() {
  // Por ora, admin e operador compartilham o mesmo dashboard.
  // Na Parte 4 haverá rotas exclusivas /admin/users, /admin/settings etc.
  redirect("/")
}
