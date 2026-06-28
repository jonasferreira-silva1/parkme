// =============================================================
// TELA DE CADASTRO
// Coleta nome, e-mail, senha e dados do veículo.
// =============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import api, { salvarTokens } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

export default function RegisterScreen() {
  const { login } = useAuthStore();
  const [carregando, setCarregando] = useState(false);

  // Dados do usuário
  const [nome, setNome]   = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pcd, setPcd]     = useState(false);

  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await api.post('/auth/register', {
        name:     nome.trim(),
        email:    email.trim().toLowerCase(),
        password: senha,
        phone:    telefone || undefined,
        pcd,
      });

      const { usuario, accessToken, refreshToken } = resposta.data;
      await login(usuario, accessToken, refreshToken);
      router.replace('/(tabs)');
    } catch (erro: any) {
      const msg = erro.response?.data?.message ?? 'Erro ao cadastrar';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.logo}>🅿️</Text>
          <Text style={styles.titulo}>Criar conta</Text>
          <Text style={styles.subtitulo}>Leva menos de 1 minuto</Text>
        </View>

        <View style={styles.form}>
          <Campo label="Nome completo *">
            <TextInput
              style={styles.input} placeholder="João Silva"
              placeholderTextColor={Colors.textMuted}
              value={nome} onChangeText={setNome}
              autoCapitalize="words" returnKeyType="next"
            />
          </Campo>

          <Campo label="E-mail *">
            <TextInput
              style={styles.input} placeholder="seu@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
            />
          </Campo>

          <Campo label="Senha * (mínimo 6 caracteres, 1 maiúscula, 1 número)">
            <TextInput
              style={styles.input} placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={senha} onChangeText={setSenha}
              secureTextEntry
            />
          </Campo>

          <Campo label="Telefone (opcional)">
            <TextInput
              style={styles.input} placeholder="11999990001"
              placeholderTextColor={Colors.textMuted}
              value={telefone} onChangeText={setTelefone}
              keyboardType="phone-pad"
            />
          </Campo>

          {/* Toggle PCD */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Sou pessoa com deficiência (PCD)</Text>
              <Text style={styles.toggleSub}>Garante prioridade em vagas especiais</Text>
            </View>
            <Switch
              value={pcd}
              onValueChange={setPcd}
              trackColor={{ true: Colors.blue, false: Colors.border }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[styles.btnCadastro, carregando && { opacity: 0.6 }]}
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnTexto}>Criar conta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkLogin} onPress={() => router.back()}>
            <Text style={styles.linkLoginTexto}>
              Já tem conta?{' '}
              <Text style={{ color: Colors.blue, fontWeight: '600' }}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Sub-componente de campo reutilizável
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header:    { alignItems: 'center', marginBottom: Spacing.xl },
  logo:      { fontSize: 48, marginBottom: Spacing.sm },
  titulo:    { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitulo: { color: Colors.textSecondary, fontSize: FontSize.base, marginTop: 4 },
  form:      { gap: Spacing.md },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
    color: Colors.textPrimary, fontSize: FontSize.base,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  toggleLabel: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '500' },
  toggleSub:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  btnCadastro: {
    backgroundColor: Colors.blue, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnTexto:    { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  linkLogin:   { alignItems: 'center', paddingVertical: Spacing.sm },
  linkLoginTexto: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
