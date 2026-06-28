// =============================================================
// FloorSelector — Seletor de andar para o mapa do estacionamento
// =============================================================

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize } from '../constants/theme';

interface Props {
  totalAndares: number;
  andarAtual:   number;
  onSelect:     (andar: number) => void;
}

export function FloorSelector({ totalAndares, andarAtual, onSelect }: Props) {
  const andares = Array.from({ length: totalAndares }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Andar</Text>
      <View style={styles.botoes}>
        {andares.map((andar) => (
          <TouchableOpacity
            key={andar}
            style={[styles.botao, andarAtual === andar && styles.botaoAtivo]}
            onPress={() => onSelect(andar)}
            activeOpacity={0.75}
          >
            <Text style={[styles.botaoTexto, andarAtual === andar && styles.botaoTextoAtivo]}>
              {andar}º
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  botoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botao: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAtivo: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  botaoTexto: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  botaoTextoAtivo: {
    color: '#fff',
  },
});
