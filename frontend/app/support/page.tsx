// =============================================================
// PÁGINA SUPORTE — Contato do desenvolvedor e documentação
// =============================================================

import { Mail, BookOpen, MessageCircle, ExternalLink, GitFork } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"

// SVG do GitHub (ícone oficial — lucide não tem na v1.17)
function IconeGithub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function SupportPage() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Suporte" subtitulo="Ajuda, documentação e contato com o desenvolvedor" />
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-3xl">

          {/* Card do desenvolvedor */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-xl">👨‍💻</span>
                Desenvolvedor
              </CardTitle>
              <CardDescription>
                Sistema desenvolvido por Jonas Ferreira Silva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  JS
                </div>
                <div>
                  <p className="font-semibold text-lg">Jonas Ferreira Silva</p>
                  <p className="text-sm text-muted-foreground">
                    Desenvolvedor Full Stack — ParkMe Sistema de Estacionamento
                  </p>
                </div>
              </div>

              <Separator />

              {/* Links de contato */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href="mailto:jonas.fsilva1@hotmail.com"
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-400">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      jonas.fsilva1@hotmail.com
                    </p>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                </a>

                <a
                  href="https://github.com/jonasferreira-silva1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-500/15 text-slate-400">
                    <IconeGithub className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GitHub</p>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      jonasferreira-silva1
                    </p>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Repositório do projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitFork className="size-4" />
                Repositório do Projeto
              </CardTitle>
              <CardDescription>
                Código-fonte completo disponível no GitHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="https://github.com/jonasferreira-silva1/parkme"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <IconeGithub className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      jonasferreira-silva1/parkme
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sistema completo: API NestJS · Frontend Next.js · Mobile React Native
                    </p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-muted-foreground shrink-0" />
              </a>
            </CardContent>
          </Card>

          {/* Documentação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4" />
                Documentação
              </CardTitle>
              <CardDescription>
                Guias técnicos e referências da API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  titulo:    "Swagger UI — API REST",
                  descricao: "Documentação interativa de todos os endpoints",
                  href:      "http://localhost:3000/api",
                  icone:     "📡",
                },
                {
                  titulo:    "Guia de Integração Frontend",
                  descricao: "Plano das 4 partes de integração do dashboard",
                  href:      "https://github.com/jonasferreira-silva1/parkme/blob/main/docs/integration-plan.md",
                  icone:     "📋",
                },
                {
                  titulo:    "Documentação Técnica",
                  descricao: "Arquitetura, modelo de dados e WebSocket events",
                  href:      "https://github.com/jonasferreira-silva1/parkme/blob/main/docs/index.html",
                  icone:     "🏗️",
                },
              ].map((doc) => (
                <a
                  key={doc.href}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-lg border border-border bg-background/60 px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <span className="text-2xl">{doc.icone}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{doc.titulo}</p>
                    <p className="text-xs text-muted-foreground">{doc.descricao}</p>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Stack técnica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="size-4" />
                Sobre o sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Backend",   valor: "NestJS + TypeScript",   cor: "#E0234E" },
                  { label: "Frontend",  valor: "Next.js 16 + Tailwind", cor: ""        },
                  { label: "Mobile",    valor: "React Native + Expo",   cor: "#61DAFB" },
                  { label: "Banco",     valor: "PostgreSQL + Prisma",   cor: "#336791" },
                  { label: "Real-time", valor: "Socket.io WebSocket",   cor: ""        },
                  { label: "Versão",    valor: "1.0.0",                 cor: "#10b981" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                    <p
                      className="text-sm font-medium"
                      style={item.cor ? { color: item.cor } : undefined}
                    >
                      {item.valor}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-center text-muted-foreground">
                ParkMe v1.0.0 · MIT License · Desenvolvido por{" "}
                <a
                  href="https://github.com/jonasferreira-silva1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Jonas Ferreira Silva
                </a>
              </p>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  )
}
