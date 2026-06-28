// =============================================================
// TELA PERFIL — Dados do usuário, veículos e configurações
// =============================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

interface Veiculo {
  id: string; plate: string; brand: string; model: string; color: string;
}

export default function ProfileScreen() {
  const { usuario, logout } = useAuthStore();
  const [veiculos, setVeiculos]   = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarVeiculos = async () => {
    try {
      const resposta = await api.get('/vehicles');
      setVeiculos(resposta.data);
    } catch { /* silencia */ } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarVeiculos(); }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const handleRemoverVeiculo = (id: string, placa: string) => {
    Alert.alert(
      'Remover veículo',
      `Remover ${placa}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${id}`);
              setVeiculos((ant) => ant.filter((v) => v.id !== id));
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.message ?? 'Não foi possível remover');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Card do usuário */}
      <View style={styles.usuarioCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>
            {usuario?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.usuarioInfo}>
          <Text style={styles.usuarioNome}>{usuario?.name}</Text>
          <Text style={styles.usuarioEmail}>{usuario?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleCor(usuario?.role) + '20', borderColor: roleCor(usuario?.role) + '50' }]}>
            <Text style={[styles.roleTexto, { color: roleCor(usuario?.role) }]}>
              {roleLabel(usuario?.role)}
            </Text>
          </View>
        </View>
      </View>

      {/* Veículos */}
      <View style={styles.secao}>
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>🚙 Meus veículos</Text>
          <TouchableOpacity
            style={styles.btnAdicionar}
            onPress={() => Alert.alert('Em breve', 'Cadastro de veículos via formulário')}
          >
            <Text style={styles.btnAdicionarTexto}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {carregando
          ? <ActivityIndicator color={Colors.blue} />
          : veiculos.length === 0
            ? <Text style={styles.vazioTexto}>Nenhum veículo cadastrado</Text>
            : veiculos.map((v) => (
                <View key={v.id} style={styles.veiculoCard}>
                  <View style={styles.veiculoInfo}>
                    <Text style={styles.veiculoPlaca}>{v.plate}</Text>
                    <Text style={styles.veiculoDetalhe}>{v.brand} {v.model} · {v.color}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoverVeiculo(v.id, v.plate)}
                    style={styles.btnRemover}
                  >
                    <Text style={styles.btnRemoverTexto}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
        }
      </View>

      {/* Botão logout */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutTexto}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.versao}>ParkMe v1.0.0</Text>
    </ScrollView>
  );
}

// Utilitários para role
function roleLabel(role?: string): string {
  switch (role) {
    case 'ADMIN':    return '🛡️ Administrador';
    case 'OPERATOR': return '🔧 Operador';
    default:         return '🚗 Motorista';
  }
}

function roleCor(role?: string): string {
  switch (role) {
    case 'ADMIN':    return Colors.purple;
    case 'OPERATOR': return Colors.yellow;
    default:         return Colors.blue;
  }
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:     { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  usuarioCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.blue + '33',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.blue,
  },
  avatarLetra:   { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.blue },
  usuarioInfo:   { flex: 1, gap: 4 },
  usuarioNome:   { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  usuarioEmail:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  roleBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1, marginTop: 4,
  },
  roleTexto: { fontSize: FontSize.xs, fontWeight: '600' },
  secao:       { gap: Spacing.sm },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secaoTitulo: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  btnAdicionar: {
    backgroundColor: Colors.blue + '20', borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.blue + '50',
  },
  btnAdicionarTexto: { color: Colors.blue, fontSize: FontSize.sm, fontWeight: '600' },
  vazioTexto: { color: Colors.textMuted, fontSize: FontSize.sm },
  veiculoCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
  },
  veiculoInfo:   { flex: 1 },
  veiculoPlaca:  { fontSize: FontSize.base, fontWeight: '800', color: Colors.textPrimary, fontVariant: ['small-caps'] },
  veiculoDetalhe: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  btnRemover:    { padding: Spacing.sm },
  btnRemoverTexto: { fontSize: 18 },
  btnLogout: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnLogoutTexto: { color: Colors.red, fontSize: FontSize.base, fontWeight: '700' },
  versao: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
});
