// =============================================================
// SpotCard — Card que exibe as informações da vaga do motorista
//
// Exibido na tela "Meu Carro" com setor, andar e número da vaga.
// =============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

interface Props {
  floor:  number;
  sector: string;
  number: number;
  type:   'STANDARD' | 'DISABLED' | 'VIP';
}

// Retorna o rótulo e a cor baseado no tipo da vaga
function infoTipo(type: Props['type']): { label: string; cor: string } {
  switch (type) {
    case 'VIP':      return { label: '⭐ VIP',       cor: Colors.purple };
    case 'DISABLED': return { label: '♿ PCD',       cor: Colors.blue   };
    default:         return { label: '🅿️ Padrão',   cor: Colors.green  };
  }
}

export function SpotCard({ floor, sector, number, type }: Props) {
  const { label: tipoLabel, cor: tipoCor } = infoTipo(type);

  return (
    <View style={styles.card}>
      {/* Linha superior com o tipo da vaga */}
      <View style={[styles.tipoBadge, { backgroundColor: tipoCor + '22', borderColor: tipoCor + '55' }]}>
        <Text style={[styles.tipoTexto, { color: tipoCor }]}>{tipoLabel}</Text>
      </View>

      {/* Três informações principais lado a lado */}
      <View style={styles.infoRow}>
        <InfoItem label="Andar"  value={String(floor)}         />
        <Divisor />
        <InfoItem label="Setor"  value={sector}                />
        <Divisor />
        <InfoItem label="Vaga"   value={String(number)}        />
      </View>

      {/* Código completo da vaga (ex: B-07 | Andar 2) */}
      <Text style={styles.codigoCompleto}>
        Setor {sector} · Vaga {number} · {floor}º andar
      </Text>
    </View>
  );
}

// Sub-componente de um item de informação
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Linha divisória vertical entre os itens
function Divisor() {
  return <View style={styles.divisor} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  tipoBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tipoTexto: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  infoItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    lineHeight: FontSize.xxxl + 4,
  },
  divisor: {
    width: 1,
    height: 48,
    backgroundColor: Colors.border,
  },
  codigoCompleto: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
