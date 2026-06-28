// =============================================================
// Timer — Countdown regressivo ao vivo da sessão
//
// Atualiza a cada segundo mostrando tempo decorrido ou restante.
// Muda de cor conforme o tempo passa (verde → amarelo → vermelho).
// =============================================================

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  entryAt: string;   // ISO timestamp da entrada
  mode?: 'decorrido' | 'restante';
  tempoContratadoMin?: number; // Necessário para mode='restante'
}

export function Timer({ entryAt, mode = 'decorrido', tempoContratadoMin }: Props) {
  const [segundos, setSegundos] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calcula os segundos decorridos desde a entrada
  const calcularSegundos = () => {
    const entrada = new Date(entryAt).getTime();
    const agora   = new Date().getTime();
    return Math.floor((agora - entrada) / 1000);
  };

  useEffect(() => {
    setSegundos(calcularSegundos());

    // Atualiza a cada segundo
    intervalRef.current = setInterval(() => {
      setSegundos(calcularSegundos());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [entryAt]);

  // Formata segundos para HH:MM:SS
  const formatarTempo = (totalSeg: number): string => {
    const h = Math.floor(totalSeg / 3600);
    const m = Math.floor((totalSeg % 3600) / 60);
    const s = totalSeg % 60;

    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0'),
    ].join(':');
  };

  // Calcula a cor baseada no tempo
  const calcularCor = (): string => {
    const minutos = Math.floor(segundos / 60);

    if (mode === 'restante' && tempoContratadoMin) {
      const restante = tempoContratadoMin - minutos;
      if (restante <= 15) return Colors.red;    // Vermelho: urgente
      if (restante <= 30) return Colors.yellow; // Amarelo: atenção
      return Colors.green;
    }

    // Modo decorrido: fica amarelo após 1h, vermelho após 2h
    if (minutos >= 120) return Colors.red;
    if (minutos >= 60)  return Colors.yellow;
    return Colors.green;
  };

  const tempoDecorrido = segundos;
  const cor = calcularCor();
  const minutos = Math.floor(segundos / 60);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {mode === 'decorrido' ? 'Tempo estacionado' : 'Tempo restante'}
      </Text>

      {/* Contador grande */}
      <Text style={[styles.relogio, { color: cor }]}>
        {formatarTempo(tempoDecorrido)}
      </Text>

      {/* Resumo textual */}
      <Text style={styles.resumo}>
        {minutos < 60
          ? `${minutos} minuto${minutos !== 1 ? 's' : ''}`
          : `${Math.floor(minutos / 60)}h ${minutos % 60}min`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  relogio: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'], // Impede "pulo" de layout ao mudar números
    letterSpacing: 2,
  },
  resumo: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
});
