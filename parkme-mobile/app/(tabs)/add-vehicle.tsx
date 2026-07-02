// =============================================================
// TELA CADASTRAR VEÍCULO — Formulário completo de cadastro
//
// Acessada pelo botão "+ Adicionar" na tela de Perfil.
// Após cadastrar com sucesso, volta para o perfil automaticamente.
// =============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

// Marcas mais comuns para sugestão rápida
const MARCAS_SUGERIDAS = ['Fiat', 'Volkswagen', 'Chevrolet', 'Toyota', 'Honda', 'Hyundai', 'Ford', 'Renault'];

export default function AddVehicleScreen() {
  const [placa, setPlaca]   = useState('');
  const [marca, setMarca]   = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor]       = useState('');
  const [carregando, setCarregando] = useState(false);

  // Erros de validação por campo
  const [erros, setErros] = useState<Record<string, string>>({});

  // -----------------------------------------------------------
  // Formata a placa conforme o usuário digita
  // Aceita padrão antigo (ABC-1234) e Mercosul (ABC1D23)
  // -----------------------------------------------------------
  const formatarPlaca = (texto: string) => {
    // Remove tudo que não for letra ou número e converte para maiúsculas
    const limpa = texto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
    setPlaca(limpa);
    // Limpa o erro ao editar
    if (erros.placa) setErros((e) => ({ ...e, placa: '' }));
  };

  // Exibe a placa formatada com hífen para leitura (ABC-1234 ou ABC1D23)
  const placaFormatada = placa.length > 3 ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;

  // -----------------------------------------------------------
  // Validação do formulário antes de enviar
  // -----------------------------------------------------------
  const validar = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (placa.length < 7) {
      novosErros.placa = 'Placa deve ter 7 caracteres (ex: ABC1D23)';
    }
    if (!marca.trim()) {
      novosErros.marca = 'Marca é obrigatória';
    }
    if (!modelo.trim()) {
      novosErros.modelo = 'Modelo é obrigatório';
    }
    if (!cor.trim()) {
      novosErros.cor = 'Cor é obrigatória';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // -----------------------------------------------------------
  // Envia o formulário para a API
  // -----------------------------------------------------------
  const handleCadastrar = async () => {
    if (!validar()) return;

    setCarregando(true);
    try {
      await api.post('/vehicles', {
        plate: placa,
        brand: marca.trim(),
        model: modelo.trim(),
        color: cor.trim(),
      });

      Alert.alert(
        '✅ Veículo cadastrado!',
        `${marca} ${modelo} (${placa}) foi adicionado com sucesso.`,
        [{ text: 'Ok', onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Erro ao cadastrar veículo';
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Cabeçalho informativo */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🚗</Text>
          <Text style={styles.headerTitulo}>Novo veículo</Text>
          <Text style={styles.headerSub}>
            Cadastre sua placa para identificação automática ao entrar no estacionamento.
          </Text>
        </View>

        {/* Campo: Placa */}
        <Campo label="Placa *" erro={erros.placa}>
          <TextInput
            style={[styles.input, styles.inputPlaca, erros.placa ? styles.inputErro : null]}
            placeholder="ABC1D23"
            placeholderTextColor={Colors.textMuted}
            value={placaFormatada}
            onChangeText={formatarPlaca}
            autoCapitalize="characters"
            maxLength={8} // 7 chars + hífen formatado
            returnKeyType="next"
          />
        </Campo>

        {/* Sugestões rápidas de marca */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Marca *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugestoesScroll}>
            <View style={styles.sugestoes}>
              {MARCAS_SUGERIDAS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chipMarca, marca === m && styles.chipMarcaAtivo]}
                  onPress={() => { setMarca(m); setErros((e) => ({ ...e, marca: '' })); }}
                >
                  <Text style={[styles.chipMarcaTexto, marca === m && styles.chipMarcaTextoAtivo]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TextInput
            style={[styles.input, erros.marca ? styles.inputErro : null]}
            placeholder="Ou digite a marca..."
            placeholderTextColor={Colors.textMuted}
            value={marca}
            onChangeText={(t) => { setMarca(t); setErros((e) => ({ ...e, marca: '' })); }}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {erros.marca ? <Text style={styles.textoErro}>{erros.marca}</Text> : null}
        </View>

        {/* Campo: Modelo */}
        <Campo label="Modelo *" erro={erros.modelo}>
          <TextInput
            style={[styles.input, erros.modelo ? styles.inputErro : null]}
            placeholder="Ex: Onix, Corolla, Civic..."
            placeholderTextColor={Colors.textMuted}
            value={modelo}
            onChangeText={(t) => { setModelo(t); setErros((e) => ({ ...e, modelo: '' })); }}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </Campo>

        {/* Campo: Cor */}
        <Campo label="Cor *" erro={erros.cor}>
          <TextInput
            style={[styles.input, erros.cor ? styles.inputErro : null]}
            placeholder="Ex: Prata, Preto, Branco..."
            placeholderTextColor={Colors.textMuted}
            value={cor}
            onChangeText={(t) => { setCor(t); setErros((e) => ({ ...e, cor: '' })); }}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={handleCadastrar}
          />
        </Campo>

        {/* Preview da placa */}
        {placa.length === 7 && (
          <View style={styles.previewPlaca}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.placaCard}>
              <Text style={styles.placaBrasil}>🇧🇷 BRASIL</Text>
              <Text style={styles.placaNumero}>{placaFormatada}</Text>
              {marca || modelo ? (
                <Text style={styles.placaVeiculo}>{marca} {modelo}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Botões */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.btnCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnCadastrar, carregando && { opacity: 0.6 }]}
            onPress={handleCadastrar}
            disabled={carregando}
            activeOpacity={0.8}
          >
            {carregando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnCadastrarTexto}>Cadastrar</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Sub-componente de campo com label e erro
function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      {children}
      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:    { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerEmoji:  { fontSize: 44 },
  headerTitulo: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  campo:      { gap: 6 },
  campoLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },

  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  inputPlaca: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  inputErro:  { borderColor: Colors.red },
  textoErro:  { color: Colors.red, fontSize: FontSize.xs },

  // Chips de marcas sugeridas
  sugestoesScroll: { marginBottom: 8 },
  sugestoes: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chipMarca: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipMarcaAtivo: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  chipMarcaTexto:      { color: Colors.textSecondary, fontSize: FontSize.sm },
  chipMarcaTextoAtivo: { color: '#fff', fontWeight: '600' },

  // Preview da placa
  previewPlaca: { alignItems: 'center', gap: 8 },
  previewLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  placaCard: {
    backgroundColor: Colors.yellow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
    minWidth: 180,
  },
  placaBrasil: { fontSize: FontSize.xs, color: '#1a1a1a', fontWeight: '600' },
  placaNumero: { fontSize: FontSize.xxxl, fontWeight: '900', color: '#1a1a1a', letterSpacing: 4 },
  placaVeiculo: { fontSize: FontSize.xs, color: '#444', marginTop: 2 },

  // Botões
  botoes: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  btnCancelar: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  btnCancelarTexto: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '600' },
  btnCadastrar: {
    flex: 2,
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  btnCadastrarTexto: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});
