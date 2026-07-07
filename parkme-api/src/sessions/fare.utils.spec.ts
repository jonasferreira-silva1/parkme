// =============================================================
// TESTES — Cálculo de tarifa
// Mistura testes unitários clássicos + property-based (fast-check)
// Para rodar: npm run test
// =============================================================

import * as fc from 'fast-check';
import {
  calcularTarifa,
  calcularMinutos,
  temPrecoDinamico,
} from './fare.utils';

describe('calcularTarifa — testes unitários', () => {
  it('cobra exatamente 1 hora para sessões abaixo de 60 minutos', () => {
    // 30 minutos com R$15/h deve cobrar R$15 (mínimo 1h)
    expect(calcularTarifa(30, 15, 0.5)).toBe(15.0);
  });

  it('cobra 1 hora exata para 60 minutos', () => {
    expect(calcularTarifa(60, 15, 0.5)).toBe(15.0);
  });

  it('cobra proporcionalmente para 90 minutos (1.5h)', () => {
    // 90min = 1.5h × R$15 = R$22.50
    expect(calcularTarifa(90, 15, 0.5)).toBe(22.5);
  });

  it('cobra proporcionalmente para 2 horas', () => {
    expect(calcularTarifa(120, 15, 0.5)).toBe(30.0);
  });

  it('aplica +20% quando ocupação está acima de 80%', () => {
    // 60min × R$15 × 1.2 = R$18
    expect(calcularTarifa(60, 15, 0.85)).toBe(18.0);
  });

  it('NÃO aplica preço dinâmico quando ocupação é exatamente 80%', () => {
    // O limite é MAIOR que 80%, então 80% exato não aplica
    expect(calcularTarifa(60, 15, 0.8)).toBe(15.0);
  });

  it('retorna 0 quando o preço por hora é 0', () => {
    expect(calcularTarifa(60, 0, 0.5)).toBe(0);
  });

  it('lida com 0 minutos (mínimo de 1h é aplicado)', () => {
    expect(calcularTarifa(0, 15, 0.5)).toBe(15.0);
  });
});

describe('calcularTarifa — property-based (fast-check)', () => {
  it('PROPRIEDADE: tarifa nunca é negativa', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1440 }), // Duração: 0 a 24h
        fc.float({ min: 0, max: 100, noNaN: true }), // Preço: R$0 a R$100/h
        fc.float({ min: 0, max: 1, noNaN: true }), // Ocupação: 0% a 100%
        (minutos, preco, ocupacao) => {
          const tarifa = calcularTarifa(minutos, preco, ocupacao);
          // Tarifa jamais pode ser negativa
          expect(tarifa).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('PROPRIEDADE: mínimo cobrado nunca é menor que 1 hora', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 59 }), // Qualquer duração menor que 1h
        fc.integer({ min: 1, max: 100 }), // Preço inteiro (evita imprecisão float)
        (minutos, preco) => {
          const tarifa = calcularTarifa(minutos, preco, 0.5);
          // Sempre cobra no mínimo 1 hora — tolerância de 0.01 para arredondamento
          expect(tarifa + 0.01).toBeGreaterThanOrEqual(preco);
        },
      ),
    );
  });

  it('PROPRIEDADE: preço dinâmico é sempre exatamente 20% maior', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 480 }), // 1h a 8h
        fc.integer({ min: 5, max: 50 }), // R$5 a R$50/h (inteiro, sem float)
        fc.integer({ min: 81, max: 100 }), // Ocupação 81–100% (como inteiro %)
        (minutos, preco, ocupacaoPercent) => {
          const ocupacao = ocupacaoPercent / 100; // converte para 0.81–1.00
          const tarifaBase = calcularTarifa(minutos, preco, 0.5);
          const tarifaDinamica = calcularTarifa(minutos, preco, ocupacao);
          // O valor dinâmico deve ser 20% maior que o base
          expect(tarifaDinamica).toBeCloseTo(tarifaBase * 1.2, 1);
        },
      ),
    );
  });

  it('PROPRIEDADE: mais tempo = maior ou igual valor (monotonia)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 61, max: 720 }), // Duração A (> 1h)
        fc.integer({ min: 61, max: 720 }), // Duração B (> 1h)
        fc.float({ min: 5, max: 50, noNaN: true }),
        (minutosA, minutosB, preco) => {
          const tarifaA = calcularTarifa(minutosA, preco, 0.5);
          const tarifaB = calcularTarifa(minutosB, preco, 0.5);
          // Se A dura mais que B, A deve custar mais ou igual
          if (minutosA >= minutosB) {
            expect(tarifaA).toBeGreaterThanOrEqual(tarifaB);
          }
        },
      ),
    );
  });
});

describe('calcularMinutos', () => {
  it('calcula corretamente 90 minutos de diferença', () => {
    const entrada = new Date('2025-01-01T10:00:00Z');
    const saida = new Date('2025-01-01T11:30:00Z');
    expect(calcularMinutos(entrada, saida)).toBe(90);
  });

  it('retorna 0 quando entrada e saída são iguais', () => {
    const agora = new Date();
    expect(calcularMinutos(agora, agora)).toBe(0);
  });
});

describe('temPrecoDinamico', () => {
  it('retorna true quando ocupação é 81%', () => {
    expect(temPrecoDinamico(0.81)).toBe(true);
  });

  it('retorna false quando ocupação é 80%', () => {
    expect(temPrecoDinamico(0.8)).toBe(false);
  });

  it('retorna false quando ocupação é 50%', () => {
    expect(temPrecoDinamico(0.5)).toBe(false);
  });
});
