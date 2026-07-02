// =============================================================
// TELA CHECK-IN — Registra a entrada do veículo no estacionamento
//
// Fluxo:
//   1. Carrega os veículos do usuário
//   2. Usuário seleciona o veículo
//   3. Confirma a entrada
//   4. API atribui a melhor vaga automaticamente
//   5. Redireciona para "Meu Carro" com a sessão ativa
// =============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useSession } from '../../hooks/useSession';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

// ID do estacionamento — em produção viria de QR Code ou seleção
const LOT_ID_PADRAO = 'lot_001';

interface Veiculo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
}

export default function CheckInScreen() {
  const { registrarEntrada } = useSession();

  const [veiculos, setVeiculos]   = useState<Veiculo[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [carregando, setCarregando]   = useState(true);
  const [entrando, setEntrando]       = useState(false);

  // Carrega os veículos do usuário ao montar a tela
  useEffect(() => {
    carregarVeiculos();
  }, []);

  const carregarVeiculos = async () => {
    setCarregando(true);
    try {
      const resposta = await api.get('/vehicles');
      setVeiculos(resposta.data);
      // Pré-seleciona o primeiro veículo se houver apenas um
      if (resposta.data.length === 1) {
        setSelecionado(resposta.data[0].id);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus veículos');
    } finally {
      setCarregando(false);
    }
  };

  // -----------------------------------------------------------
  // Confirma a entrada: chama a API e vai para "Meu Carro"
  // -----------------------------------------------------------
  const handleEntrar = async () => {
    if (!selecionado) {
      Alert.alert('Atenção', 'Selecione o veículo que está entrando');
      return;
    }

    const veiculo = veiculos.find((v) => v.id === selecionado);

    Alert.alert(
      '🅿️ Confirmar entrada',
      `Entrar com ${veiculo?.brand} ${veiculo?.model} (${veiculo?.plate})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setEntrando(true);
            try {
              const sessao = await registrarEntrada(selecionado, LOT_ID_PADRAO);

              const vaga = sessao?.spot;
              Alert.alert(
                '✅ Entrada registrada!',
                `Sua vaga é: Setor ${vaga?.sector}${vaga?.number} · ${vaga?.floor}º andar\n\nBoa estada! 🚗`,
                [{
                  text: 'Ver minha vaga',
                  onPress: () => router.replace('/(tabs)/my-car'),
                }],
              );
            } catch (e: any) {
              const msg = e.response?.data?.message ?? 'Erro ao registrar entrada';
              Alert.alert('Erro', msg);
            } finally {
              setEntrando(false);
            }
          },
        },
      ],
    );
  };

  // -----------------------------------------------------------
  // Estado: carregando veículos
  // -----------------------------------------------------------
  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.carregandoTexto}>Carregando seus veículos...</Text>
      </View>
    );
  }

  // -----------------------------------------------------------
  // Estado: sem veículos cadastrados
  // -----------------------------------------------------------
  if (veiculos.length === 0) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.vazioEmoji}>🚗</Text>
        <Text style={styles.vazioTitulo}>Nenhum veículo cadastrado</Text>
        <Text style={styles.vazioSub}>
          Cadastre seu veículo antes de registrar a entrada.
        </Text>
        <TouchableOpacity
          style={styles.btnCadastrar}
          onPress={() => router.push('/(tabs)/add-vehicle')}
        >
          <Text style={styles.btnCadastrarTexto}>+ Cadastrar veículo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Título da tela */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🅿️</Text>
        <Text style={styles.headerTitulo}>Registrar entrada</Text>
        <Text style={styles.headerSub}>
          Selecione o veículo que está entrando. Uma vaga será atribuída automaticamente.
        </Text>
      </View>

      {/* Lista de veículos para seleção */}
      <Text style={styles.secaoLabel}>Selecione o veículo</Text>

      {veiculos.map((v) => {
        const ativo = selecionado === v.id;
        return (
          <TouchableOpacity
            key={v.id}
            style={[styles.veiculoCard, ativo && styles.veiculoCardAtivo]}
            onPress={() => setSelecionado(v.id)}
            activeOpacity={0.8}
          >
            {/* Ícone de seleção */}
            <View style={[styles.radioCircle, ativo && styles.radioCircleAtivo]}>
              {ativo && <View style={styles.radioDot} />}
            </View>

            {/* Informações do veículo */}
            <View style={styles.veiculoInfo}>
              <Text style={styles.veiculoPlaca}>{v.plate}</Text>
              <Text style={styles.veiculoDetalhe}>
                {v.brand} {v.model} · {v.color}
              </Text>
            </View>

            {/* Emoji de carro */}
            <Text style={styles.veiculoEmoji}>🚗</Text>
          </TouchableOpacity>
        );
      })}

      {/* Informativo sobre atribuição automática */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTexto}>
          💡 A vaga é atribuída automaticamente com base na disponibilidade. Usuários PCD têm prioridade em vagas especiais.
        </Text>
      </View>

      {/* Botão de confirmar entrada */}
      <TouchableOpacity
        style={[styles.btnEntrar, (!selecionado || entrando) && { opacity: 0.5 }]}
        onPress={handleEntrar}
        disabled={!selecionado || entrando}
        activeOpacity={0.8}
      >
        {entrando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnEntrarTexto}>✅ Confirmar entrada</Text>
        }
      </TouchableOpacity>

      {/* Link para cadastrar novo veículo */}
      <TouchableOpacity
        style={styles.linkAdicionar}
        onPress={() => router.push('/(tabs)/add-vehicle')}
      >
        <Text style={styles.linkAdicionarTexto}>
          + Adicionar outro veículo
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:    { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },

  centralizado: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  carregandoTexto: { color: Colors.textSecondary, fontSize: FontSize.base },

  // Estado vazio
  vazioEmoji:  { fontSize: 56 },
  vazioTitulo: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  vazioSub:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btnCadastrar: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnCadastrarTexto: { color: '#fff', fontWeight: '700', fontSize: FontSize.base },

  // Header
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerEmoji:  { fontSize: 48 },
  headerTitulo: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  secaoLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: -4,
  },

  // Card de veículo
  veiculoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  veiculoCardAtivo: {
    borderColor: Colors.blue,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleAtivo: { borderColor: Colors.blue },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.blue,
  },
  veiculoInfo:    { flex: 1 },
  veiculoPlaca:   { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 1 },
  veiculoDetalhe: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  veiculoEmoji:   { fontSize: 28 },

  // Caixa informativa
  infoBox: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    padding: Spacing.md,
  },
  infoTexto: { color: Colors.blueLight, fontSize: FontSize.sm, lineHeight: 20 },

  // Botão principal
  btnEntrar: {
    backgroundColor: Colors.green,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnEntrarTexto: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // Link adicionar veículo
  linkAdicionar:      { alignItems: 'center', paddingVertical: Spacing.sm },
  linkAdicionarTexto: { color: Colors.blue, fontSize: FontSize.sm, fontWeight: '600' },
});
