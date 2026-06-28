// =============================================================
// LoadingOverlay — Tela de carregamento reutilizável
// =============================================================

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/theme';

interface Props {
  mensagem?: string;
}

export function LoadingOverlay({ mensagem = 'Carregando...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.blue} />
      <Text style={styles.texto}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  texto: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
  },
});
