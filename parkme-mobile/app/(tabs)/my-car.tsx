// =============================================================
// TELA MEU CARRO — Sessão ativa com countdown e botões de ação
// =============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../hooks/useSession';
import { SpotCard } from '../../components/SpotCard';
import { Timer } from '../../components/Timer';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

export default function MyCarScreen() {
  const { sessao, carregando, valorEstimado, registrarSaida } = useSession();
  const [pagando, setPagando] = useState(false);

  // Não tem sessão ativa
  if (!sessao) {
    return (
      <View style={styles.semSessao}>
        <Text style={styles.semSessaoEmoji}>🅿️</Text>
        <Text style={styles.semSessaoTitulo}>Nenhum carro estacionado</Text>
        <Text style={styles.semSessaoSub}>
          Ao entrar no estacionamento e registrar sua entrada, você verá as informações da sua vaga aqui.
        </Text>
        <TouchableOpacity style={styles.btnCheckIn} onPress={() => router.push('/(tabs)/check-in')}>
          <Text style={styles.btnCheckInTexto}>🅿️ Registrar entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnVerMapa} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.btnVerMapaTexto}>Ver mapa de vagas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fluxo de saída: registra saída → redireciona para tela de pagamento
  const handlePagarESair = async () => {
    Alert.alert(
      '💳 Pagar e sair',
      `Valor estimado: R$ ${valorEstimado.toFixed(2)}\n\nDeseja registrar a saída agora?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setPagando(true);
            try {
              // Registra a saída e obtém o valor final calculado
              const saida = await registrarSaida();

              // Redireciona para a tela de pagamento passando os dados necessários
              router.push({
                pathname: '/payment',
                params: {
                  sessionId: saida.id,
                  amount:    String(saida.totalAmount),
                },
              });
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.message ?? 'Erro ao registrar saída');
            } finally {
              setPagando(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Card principal da vaga */}
      <SpotCard
        floor={sessao.spot.floor}
        sector={sessao.spot.sector}
        number={sessao.spot.number}
        type={sessao.spot.type as any ?? 'STANDARD'}
      />

      {/* Timer com tempo decorrido */}
      <View style={styles.timerCard}>
        <Timer entryAt={sessao.entryAt} mode="decorrido" />

        {/* Valor estimado atual */}
        <View style={styles.valorContainer}>
          <Text style={styles.valorLabel}>Valor estimado</Text>
          <Text style={styles.valorTexto}>R$ {valorEstimado.toFixed(2)}</Text>
          <Text style={styles.valorSub}>{sessao.spot.lot.name} · R$ {sessao.spot.lot.pricePerHour}/h</Text>
        </View>
      </View>

      {/* Informações do veículo */}
      <View style={styles.veiculoCard}>
        <Text style={styles.veiculoLabel}>🚙 Veículo</Text>
        <Text style={styles.veiculoTexto}>
          {sessao.vehicle.plate} — {sessao.vehicle.model}
        </Text>
        <Text style={styles.veiculoCor}>Cor: {sessao.vehicle.color}</Text>
      </View>

      {/* Botões de ação */}
      <View style={styles.botoesContainer}>
        {/* Botão: navegar até a vaga */}
        <TouchableOpacity
          style={styles.btnNavegar}
          onPress={() => router.push('/navigation/navigate')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnNavegarTexto}>🧭 Me guiar até lá</Text>
        </TouchableOpacity>

        {/* Botão: pagar e sair */}
        <TouchableOpacity
          style={[styles.btnPagar, pagando && { opacity: 0.6 }]}
          onPress={handlePagarESair}
          disabled={pagando}
          activeOpacity={0.8}
        >
          {pagando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPagarTexto}>💳 Pagar e sair</Text>
          }
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:    { padding: Spacing.md, gap: Spacing.md },

  // Estado sem sessão
  semSessao: {
    flex: 1, backgroundColor: Colors.bgPrimary,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.md,
  },
  semSessaoEmoji:  { fontSize: 64 },
  semSessaoTitulo: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  semSessaoSub:    { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  btnVerMapa: {
    backgroundColor: Colors.blue, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnVerMapaTexto: { color: '#fff', fontWeight: '700', fontSize: FontSize.base },

  // Botão de check-in
  btnCheckIn: {
    backgroundColor: Colors.green, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnCheckInTexto: { color: '#fff', fontWeight: '700', fontSize: FontSize.base },

  // Timer
  timerCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.md,
  },
  valorContainer: { alignItems: 'center', gap: 2 },
  valorLabel:     { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1 },
  valorTexto:     { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.green },
  valorSub:       { color: Colors.textMuted, fontSize: FontSize.xs },

  // Veículo
  veiculoCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 4,
  },
  veiculoLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  veiculoTexto: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  veiculoCor:   { color: Colors.textSecondary, fontSize: FontSize.sm },

  // Botões
  botoesContainer: { gap: Spacing.sm, marginTop: Spacing.sm },
  btnNavegar: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.blue,
    padding: Spacing.md, alignItems: 'center',
  },
  btnNavegarTexto: { color: Colors.blue, fontSize: FontSize.md, fontWeight: '700' },
  btnPagar: {
    backgroundColor: Colors.green, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  btnPagarTexto: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
