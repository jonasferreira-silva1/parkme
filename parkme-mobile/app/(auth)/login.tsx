// =============================================================
// TELA DE LOGIN
//
// Permite que o motorista entre com e-mail e senha.
// Após login bem-sucedido, redireciona para as tabs.
// =============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const { login } = useAuthStore();

  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros]       = useState<{ email?: string; senha?: string }>({});

  // Validação simples antes de enviar
  const validar = (): boolean => {
    const novosErros: typeof erros = {};

    if (!email.trim()) {
      novosErros.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      novosErros.email = 'E-mail inválido';
    }

    if (!senha) {
      novosErros.senha = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleLogin = async () => {
    if (!validar()) return;

    setCarregando(true);

    try {
      const resposta = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: senha,
      });

      const { usuario, accessToken, refreshToken } = resposta.data;

      // Salva no store global e tokens no armazenamento seguro
      await login(usuario, accessToken, refreshToken);

      // Navega para o app principal
      router.replace('/(tabs)');
    } catch (erro: any) {
      const msg = erro.response?.data?.message ?? 'Erro ao fazer login. Tente novamente.';
      Alert.alert('Erro', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo e título */}
        <View style={styles.header}>
          <Text style={styles.logo}>🅿️</Text>
          <Text style={styles.titulo}>ParkMe</Text>
          <Text style={styles.subtitulo}>Bem-vindo de volta!</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          {/* Campo e-mail */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>E-mail</Text>
            <TextInput
              style={[styles.input, erros.email ? styles.inputErro : null]}
              placeholder="seu@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setErros((e) => ({ ...e, email: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
            {erros.email && <Text style={styles.textoErro}>{erros.email}</Text>}
          </View>

          {/* Campo senha */}
          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Senha</Text>
            <View style={[styles.inputSenhaContainer, erros.senha ? styles.inputErro : null]}>
              <TextInput
                style={styles.inputSenha}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={senha}
                onChangeText={(t) => { setSenha(t); setErros((e) => ({ ...e, senha: undefined })); }}
                secureTextEntry={!mostrarSenha}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
                style={styles.btnMostrarSenha}
              >
                <Text style={styles.textoMostrarSenha}>
                  {mostrarSenha ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {erros.senha && <Text style={styles.textoErro}>{erros.senha}</Text>}
          </View>

          {/* Botão de login */}
          <TouchableOpacity
            style={[styles.btnLogin, carregando && styles.btnDesabilitado]}
            onPress={handleLogin}
            disabled={carregando}
            activeOpacity={0.8}
          >
            {carregando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnLoginTexto}>Entrar</Text>
            }
          </TouchableOpacity>

          {/* Link para registro */}
          <TouchableOpacity
            style={styles.linkRegistro}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.linkRegistroTexto}>
              Não tem conta?{' '}
              <Text style={{ color: Colors.blue, fontWeight: '600' }}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credenciais de teste (só em desenvolvimento) */}
        {__DEV__ && (
          <View style={styles.credenciaisTeste}>
            <Text style={styles.credenciaisLabel}>🧪 Contas de teste:</Text>
            <TouchableOpacity onPress={() => { setEmail('joao@parkme.com'); setSenha('Senha@123'); }}>
              <Text style={styles.credenciaisTexto}>joao@parkme.com · Senha@123 (Motorista)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmail('admin@parkme.com'); setSenha('Senha@123'); }}>
              <Text style={styles.credenciaisTexto}>admin@parkme.com · Senha@123 (Admin)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  titulo: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitulo: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.md,
  },
  campo: {
    gap: Spacing.xs,
  },
  campoLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  inputErro: {
    borderColor: Colors.red,
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  inputSenha: {
    flex: 1,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  btnMostrarSenha: {
    padding: Spacing.md,
  },
  textoMostrarSenha: {
    fontSize: 18,
  },
  textoErro: {
    color: Colors.red,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  btnLogin: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDesabilitado: {
    opacity: 0.6,
  },
  btnLoginTexto: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  linkRegistro: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkRegistroTexto: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  credenciaisTeste: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  credenciaisLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credenciaisTexto: {
    color: Colors.blue,
    fontSize: FontSize.xs,
  },
});
