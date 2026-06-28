// =============================================================
// FARE UTILS — Cálculo de tarifa de estacionamento
// Funções puras e testáveis (sem dependências externas).
// São usadas pelo SessionsService e pelos testes property-based.
// =============================================================

/**
 * Calcula o valor a pagar por uma sessão de estacionamento.
 *
 * @param minutos       Duração total da sessão em minutos
 * @param precoPorHora  Preço base por hora em R$
 * @param taxaOcupacao  Ocupação atual do estacionamento (0.0 a 1.0)
 * @returns             Valor em R$ com 2 casas decimais
 *
 * Regras:
 *  - Mínimo cobrado: 1 hora (mesmo que o carro fique menos tempo)
 *  - Precificação dinâmica: +20% se ocupação > 80%
 *  - Frações de hora são cobradas proporcionalmente
 */
export function calcularTarifa(
  minutos: number,
  precoPorHora: number,
  taxaOcupacao: number,
): number {
  // Garante valores positivos (proteção contra dados inválidos)
  const minutosValidos = Math.max(0, minutos);
  const precoValido = Math.max(0, precoPorHora);

  // Converte minutos para horas, aplicando o mínimo de 1 hora
  const horas = Math.max(minutosValidos / 60, 1);

  // Calcula o valor base
  let valor = horas * precoValido;

  // Aplica acréscimo de 20% quando estacionamento está com > 80% de ocupação
  if (taxaOcupacao > 0.8) {
    valor = valor * 1.2;
  }

  // Arredonda para 2 casas decimais (padrão monetário)
  return parseFloat(valor.toFixed(2));
}

/**
 * Calcula a diferença em minutos entre dois horários.
 * Usado para determinar a duração de uma sessão.
 */
export function calcularMinutos(entrada: Date, saida: Date): number {
  const diferencaMs = saida.getTime() - entrada.getTime();
  return Math.floor(diferencaMs / (1000 * 60));
}

/**
 * Verifica se o estacionamento está com preço dinâmico ativo.
 * O limite é 80% de ocupação.
 */
export function temPrecoDinamico(taxaOcupacao: number): boolean {
  return taxaOcupacao > 0.8;
}
