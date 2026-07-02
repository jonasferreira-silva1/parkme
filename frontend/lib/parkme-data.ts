// Modelos e dados simulados do ParkMe — Central de Operações
// Refletem os módulos do backend NestJS (Spots, Sessions, Payments, Analytics)

export type SpotStatus = "livre" | "ocupada" | "reservada"
export type SpotType = "comum" | "pcd"

export interface Spot {
  id: string
  floor: number
  sector: string
  number: number
  status: SpotStatus
  type: SpotType
}

export interface FloorOccupancy {
  floor: string
  ocupadas: number
  livres: number
  capacidade: number
}

export interface OccupancyPoint {
  hora: string
  ocupacao: number
  entradas: number
  saidas: number
}

export interface RevenuePoint {
  dia: string
  pix: number
  cartao: number
}

export interface SessionRow {
  id: string
  placa: string
  motorista: string
  vaga: string
  entrada: string
  duracao: string
  tarifa: number
  status: "ativa" | "expirando" | "paga"
}

// Eventos emitidos pelo gateway WebSocket /parking (ver docs)
export type FeedType = "vaga_ocupada" | "vaga_livre" | "sessao_expirando"

export interface FeedEvent {
  id: string
  type: FeedType
  label: string
  detail: string
  time: string
}

const SECTORS = ["A", "B", "C", "D"]

// Grid de vagas por andar (4 andares) — status/tipo determinísticos p/ SSR estável
export function buildSpots(): Spot[] {
  const spots: Spot[] = []
  let seed = 7
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let floor = 1; floor <= 4; floor++) {
    for (let s = 0; s < SECTORS.length; s++) {
      for (let n = 1; n <= 12; n++) {
        const r = rand()
        const status: SpotStatus = r > 0.62 ? "livre" : r > 0.55 ? "reservada" : "ocupada"
        // Vagas PCD reservadas por lei (setores A/B, primeiras vagas)
        const type: SpotType = n === 1 ? "pcd" : "comum"
        spots.push({
          id: `F${floor}-${SECTORS[s]}-${n}`,
          floor,
          sector: SECTORS[s],
          number: n,
          status,
          type,
        })
      }
    }
  }
  return spots
}

export function occupancyByFloor(spots: Spot[]): FloorOccupancy[] {
  return [1, 2, 3, 4].map((f) => {
    const inFloor = spots.filter((s) => s.floor === f)
    const ocupadas = inFloor.filter((s) => s.status !== "livre").length
    return {
      floor: `Andar ${f}`,
      ocupadas,
      livres: inFloor.length - ocupadas,
      capacidade: inFloor.length,
    }
  })
}

export const occupancyTimeline: OccupancyPoint[] = [
  { hora: "06h", ocupacao: 12, entradas: 14, saidas: 2 },
  { hora: "08h", ocupacao: 48, entradas: 40, saidas: 6 },
  { hora: "10h", ocupacao: 71, entradas: 33, saidas: 10 },
  { hora: "12h", ocupacao: 83, entradas: 26, saidas: 14 },
  { hora: "14h", ocupacao: 76, entradas: 22, saidas: 29 },
  { hora: "16h", ocupacao: 88, entradas: 31, saidas: 19 },
  { hora: "18h", ocupacao: 94, entradas: 27, saidas: 21 },
  { hora: "20h", ocupacao: 62, entradas: 9, saidas: 41 },
  { hora: "22h", ocupacao: 34, entradas: 4, saidas: 32 },
]

export const revenueWeek: RevenuePoint[] = [
  { dia: "Seg", pix: 2140, cartao: 1520 },
  { dia: "Ter", pix: 2380, cartao: 1610 },
  { dia: "Qua", pix: 2610, cartao: 1740 },
  { dia: "Qui", pix: 2490, cartao: 1980 },
  { dia: "Sex", pix: 3420, cartao: 2510 },
  { dia: "Sáb", pix: 3980, cartao: 2890 },
  { dia: "Dom", pix: 2870, cartao: 2040 },
]

export const spotTypeMix = [
  { tipo: "Comuns", valor: 176, fill: "var(--chart-1)" },
  { tipo: "PCD", valor: 16, fill: "var(--chart-2)" },
]

export const activeSessions: SessionRow[] = [
  { id: "s1", placa: "RJP-2A45", motorista: "João Silva", vaga: "F1-A-08", entrada: "18:42", duracao: "1h 12m", tarifa: 14.5, status: "ativa" },
  { id: "s2", placa: "SPX-9K11", motorista: "Maria Oliveira", vaga: "F2-C-01", entrada: "17:05", duracao: "2h 49m", tarifa: 28.0, status: "expirando" },
  { id: "s3", placa: "BRA-1E23", motorista: "Carlos Mendes", vaga: "F1-B-04", entrada: "19:15", duracao: "39m", tarifa: 8.0, status: "ativa" },
  { id: "s4", placa: "MGT-7H88", motorista: "Ana Souza", vaga: "F3-D-07", entrada: "16:20", duracao: "3h 34m", tarifa: 35.5, status: "expirando" },
  { id: "s5", placa: "PRV-3C56", motorista: "Bruno Lima", vaga: "F2-A-11", entrada: "19:48", duracao: "6m", tarifa: 4.0, status: "ativa" },
  { id: "s6", placa: "RSX-5D90", motorista: "Fernanda Reis", vaga: "F4-B-02", entrada: "15:10", duracao: "4h 44m", tarifa: 42.0, status: "paga" },
]

export const feedSeed: FeedEvent[] = [
  { id: "e1", type: "vaga_ocupada", label: "vaga_ocupada", detail: "F1-A-08 · Setor A · nº 8", time: "agora" },
  { id: "e2", type: "sessao_expirando", label: "sessao_expirando", detail: "sessão #a91f · 8 min · R$ 28,00", time: "há 1 min" },
  { id: "e3", type: "vaga_livre", label: "vaga_livre", detail: "F3-C-05 · Setor C · nº 5", time: "há 2 min" },
  { id: "e4", type: "vaga_ocupada", label: "vaga_ocupada", detail: "F2-B-02 · Setor B · nº 2", time: "há 3 min" },
]
