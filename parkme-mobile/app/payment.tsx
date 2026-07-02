// =============================================================
// TELA PAGAMENTO — Exibe QR Code Pix e opções de pagamento
//
// Fluxo:
//   1. Recebe o sessionId via parâmetro de rota
//   2. Cria o pagamento chamando a API (método: PIX ou CREDIT)
//   3. Exibe o QR Code e o código copia-e-cola
//   4. Aguarda confirmação (polling ou webhook via WS)
//   5. Quando aprovado, exibe sucesso e volta para Home
// =============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../services/api';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

// Intervalo de polling para verificar o status (em ms)
const INTERVALO_POLLING_MS = 5000;

// Máximo de tentativas de polling antes de parar (5s × 60 = 5 min)
const MAX_TENTATIVAS_POLLING = 60;

interface DadosPagamento {
  id: string;
  amount: number;
  method: 'PIX' | 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'APPROVED' | 'FAILED';
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  paidAt: string | null;
}

type MetodoPagamento = 'PIX' | 'CREDIT' | 'DEBIT';

export default function PaymentScreen() {
  // Pega o sessionId e o valor passados como parâmetros da rota
  const { sessionId, amount } = useLocalSearchParams<{ sessionId: string; amount: string }>();

  const [metodo, setMetodo]     = useState<MetodoPagamento>('PIX');
  const [pagamento, setPagamento] = useState<DadosPagamento | null>(null);
  const [criando, setCriando]   = useState(false);
  const [status, setStatus]     = useState<'idle' | 'aguardando' | 'aprovado' | 'erro'>('idle');

  // Referência do intervalo para limpar ao desmontar
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tentativasRef = useRef(0);

  // Limpa o polling ao sair da tela
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // -----------------------------------------------------------
  // Cria o pagamento e inicia o polling de status
  // -----------------------------------------------------------
  const handlePagar = async () => {
    setCriando(true);
    try {
      const resposta = await api.post(`/payments/${sessionId}`, { method: metodo });
      setPagamento(resposta.data);
      setStatus('aguardando');

      // Inicia o polling para verificar quando o pagamento for aprovado
      iniciarPolling(resposta.data.id);
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Erro ao criar pagamento';
      Alert.alert('Erro', msg);
      setStatus('erro');
    } finally {
      setCriando(false);
    }
  };

  // -----------------------------------------------------------
  // Polling: consulta o status do pagamento a cada 5 segundos
  // -----------------------------------------------------------
  const iniciarPolling = (paymentId: string) => {
    tentativasRef.current = 0;

    pollingRef.current = setInterval(async () => {
      tentativasRef.current += 1;

      // Para o polling após o limite máximo de tentativas
      if (tentativasRef.current >= MAX_TENTATIVAS_POLLING) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }

      try {
        const resposta = await api.get(`/payments/${paymentId}`);
        const statusAtual = resposta.data.status;

        if (statusAtual === 'APPROVED') {
          // Para o polling e exibe sucesso
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPagamento(resposta.data);
          setStatus('aprovado');
        } else if (statusAtual === 'FAILED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus('erro');
        }
      } catch {
        // Silencia erros de rede no polling — tenta de novo
      }
    }, INTERVALO_POLLING_MS);
  };

  // -----------------------------------------------------------
  // [DEV] Confirma o pagamento manualmente sem webhook real
  // -----------------------------------------------------------
  const handleConfirmarDev = async () => {
    if (!pagamento) return;
    try {
      await api.post(`/payments/${pagamento.id}/confirm-dev`);
      setStatus('aprovado');
      if (pollingRef.current) clearInterval(pollingRef.current);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Erro ao confirmar');
    }
  };

  // -----------------------------------------------------------
  // Copia o código Pix para a área de transferência
  // -----------------------------------------------------------
  const handleCopiarPix = () => {
    if (pagamento?.pixCopyPaste) {
      Clipboard.setString(pagamento.pixCopyPaste);
      Alert.alert('✅ Copiado!', 'Código Pix copiado para a área de transferência');
    }
  };

  // -----------------------------------------------------------
  // Render: Aprovado
  // -----------------------------------------------------------
  if (status === 'aprovado') {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.sucessoEmoji}>✅</Text>
        <Text style={styles.sucessoTitulo}>Pagamento confirmado!</Text>
        <Text style={styles.sucessoSub}>
          R$ {Number(amount).toFixed(2)} pago com sucesso.{'\n'}Sua vaga foi liberada.
        </Text>
        <TouchableOpacity
          style={styles.btnVoltar}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.btnVoltarTexto}>Voltar ao mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Valor a pagar */}
      <View style={styles.valorCard}>
        <Text style={styles.valorLabel}>Total a pagar</Text>
        <Text style={styles.valorTexto}>R$ {Number(amount).toFixed(2)}</Text>
      </View>

      {/* Seleção de método — só aparece antes de criar o pagamento */}
      {status === 'idle' && (
        <>
          <Text style={styles.secaoLabel}>Forma de pagamento</Text>

          <View style={styles.metodos}>
            {(['PIX', 'CREDIT', 'DEBIT'] as MetodoPagamento[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.metodoBtn, metodo === m && styles.metodoBtnAtivo]}
                onPress={() => setMetodo(m)}
                activeOpacity={0.8}
              >
                <Text style={styles.metodoEmoji}>
                  {m === 'PIX' ? '🔑' : m === 'CREDIT' ? '💳' : '💳'}
                </Text>
                <Text style={[styles.metodoTexto, metodo === m && styles.metodoTextoAtivo]}>
                  {m === 'PIX' ? 'Pix' : m === 'CREDIT' ? 'Crédito' : 'Débito'}
                </Text>
                {m === 'PIX' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexto}>Instantâneo</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btnPagar, criando && { opacity: 0.6 }]}
            onPress={handlePagar}
            disabled={criando}
            activeOpacity={0.8}
          >
            {criando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPagarTexto}>Gerar pagamento</Text>
            }
          </TouchableOpacity>
        </>
      )}

      {/* QR Code Pix */}
      {status === 'aguardando' && pagamento?.method === 'PIX' && (
        <>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitulo}>📱 Pague com Pix</Text>
            <Text style={styles.qrSub}>
              Abra o app do seu banco, vá em Pix → Pagar → Copia e Cola
            </Text>

            {/* Simulação visual do QR Code (em produção usaria react-native-qrcode-svg) */}
            <View style={styles.qrBox}>
              <Text style={styles.qrEmoji}>⬛⬛⬜⬛⬛{'\n'}⬛⬜⬛⬜⬛{'\n'}⬜⬛⬜⬛⬜{'\n'}⬛⬜⬛⬜⬛{'\n'}⬛⬛⬜⬛⬛</Text>
              <Text style={styles.qrAviso}>QR Code ilustrativo{'\n'}(integre react-native-qrcode-svg para produção)</Text>
            </View>

            {/* Código copia e cola */}
            <TouchableOpacity style={styles.copiaCola} onPress={handleCopiarPix} activeOpacity={0.8}>
              <View style={styles.copiaColaTextoContainer}>
                <Text style={styles.copiaColaLabel}>Código Copia e Cola</Text>
                <Text style={styles.copiaColaValor} numberOfLines={2}>
                  {pagamento.pixCopyPaste?.slice(0, 60)}...
                </Text>
              </View>
              <View style={styles.copiarBtn}>
                <Text style={styles.copiarBtnTexto}>📋 Copiar</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Indicador de aguardando */}
          <View style={styles.aguardandoContainer}>
            <ActivityIndicator color={Colors.blue} size="small" />
            <Text style={styles.aguardandoTexto}>
              Aguardando confirmação do pagamento...
            </Text>
          </View>

          {/* Botão DEV para simular aprovação sem webhook */}
          {__DEV__ && (
            <TouchableOpacity style={styles.btnDev} onPress={handleConfirmarDev}>
              <Text style={styles.btnDevTexto}>🧪 [DEV] Simular aprovação</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Crédito/Débito — mensagem simples (gateway externo gerenciaria o UI) */}
      {status === 'aguardando' && pagamento?.method !== 'PIX' && (
        <View style={styles.cartaoCard}>
          <Text style={styles.cartaoEmoji}>💳</Text>
          <Text style={styles.cartaoTitulo}>Processando pagamento...</Text>
          <Text style={styles.cartaoSub}>
            Seu pagamento está sendo processado pelo gateway. Isso pode levar alguns instantes.
          </Text>
          <ActivityIndicator color={Colors.blue} style={{ marginTop: Spacing.md }} />

          {__DEV__ && (
            <TouchableOpacity style={[styles.btnDev, { marginTop: Spacing.md }]} onPress={handleConfirmarDev}>
              <Text style={styles.btnDevTexto}>🧪 [DEV] Simular aprovação</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  sucessoEmoji:  { fontSize: 72 },
  sucessoTitulo: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.green, textAlign: 'center' },
  sucessoSub: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnVoltar: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnVoltarTexto: { color: '#fff', fontWeight: '700', fontSize: FontSize.base },

  // Card do valor
  valorCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  valorLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1 },
  valorTexto: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.green },

  secaoLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Seleção de método
  metodos: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metodoBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  metodoBtnAtivo: {
    borderColor: Colors.blue,
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  metodoEmoji:      { fontSize: 22 },
  metodoTexto:      { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  metodoTextoAtivo: { color: Colors.blue },
  badge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeTexto: { color: Colors.green, fontSize: 9, fontWeight: '700' },

  btnPagar: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnPagarTexto: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // QR Code
  qrCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  qrTitulo: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  qrSub:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 180,
  },
  qrEmoji:  { fontSize: 20, lineHeight: 26, letterSpacing: 2, color: '#1a1a1a' },
  qrAviso:  { fontSize: FontSize.xs, color: '#888', textAlign: 'center' },

  // Copia e cola
  copiaCola: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  copiaColaTextoContainer: { flex: 1 },
  copiaColaLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 2 },
  copiaColaValor: { color: Colors.textSecondary, fontSize: FontSize.xs, fontFamily: 'monospace' },
  copiarBtn: {
    backgroundColor: Colors.blue + '22',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.blue + '44',
  },
  copiarBtnTexto: { color: Colors.blue, fontSize: FontSize.sm, fontWeight: '600' },

  // Aguardando
  aguardandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  aguardandoTexto: { color: Colors.textSecondary, fontSize: FontSize.sm },

  // Cartão/Débito
  cartaoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartaoEmoji:  { fontSize: 48 },
  cartaoTitulo: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  cartaoSub:    { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Botão DEV
  btnDev: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    padding: Spacing.md,
    alignItems: 'center',
  },
  btnDevTexto: { color: Colors.yellow, fontSize: FontSize.sm, fontWeight: '600' },
});
