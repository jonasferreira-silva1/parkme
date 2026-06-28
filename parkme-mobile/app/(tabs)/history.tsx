// =============================================================
// TELA HISTÓRICO — Lista de sessões anteriores paginada
// =============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

// Tipo de uma sessão no histórico
interface SessaoHistorico {
  id:           string;
  entryAt:      string;
  exitAt:       string;
  totalMinutes: number;
  totalAmount:  number;
  status:       string;
  spot:         { floor: number; sector: string; number: number };
  vehicle:      { plate: string };
  payment:      { status: string; method: string; paidAt: string } | null;
}

// Formata uma data ISO para exibição legível
function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Formata minutos para "1h 30min"
function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// Cor e label do status de pagamento
function infoPagamento(status: string | undefined): { cor: string; label: string } {
  switch (status) {
    case 'APPROVED': return { cor: Colors.green, label: '✅ Pago' };
    case 'PENDING':  return { cor: Colors.yellow, label: '⏳ Pendente' };
    case 'FAILED':   return { cor: Colors.red, label: '❌ Falhou' };
    default:         return { cor: Colors.textMuted, label: '—' };
  }
}

export default function HistoryScreen() {
  const [sessoes, setSessoes]   = useState<SessaoHistorico[]>([]);
  const [pagina, setPagina]     = useState(1);
  const [total, setTotal]       = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [fim, setFim]           = useState(false);

  const carregarMais = useCallback(async (paginaNum = 1) => {
    if (carregando || fim) return;
    setCarregando(true);

    try {
      const resposta = await api.get('/sessions/history', {
        params: { page: paginaNum, limit: 10 },
      });

      const { dados, paginacao } = resposta.data;

      setSessoes((ant) => paginaNum === 1 ? dados : [...ant, ...dados]);
      setTotal(paginacao.total);
      setFim(paginaNum >= paginacao.totalPaginas);
      setPagina(paginaNum + 1);
    } catch (e) {
      console.error('Erro ao buscar histórico:', e);
    } finally {
      setCarregando(false);
    }
  }, [carregando, fim]);

  useEffect(() => { carregarMais(1); }, []);

  // Card de uma sessão
  const renderItem = ({ item }: { item: SessaoHistorico }) => {
    const { cor: corPag, label: labelPag } = infoPagamento(item.payment?.status);

    return (
      <View style={styles.card}>
        {/* Cabeçalho: placa e vaga */}
        <View style={styles.cardHeader}>
          <Text style={styles.placa}>{item.vehicle.plate}</Text>
          <Text style={styles.vaga}>
            {item.spot.sector}{item.spot.number} · {item.spot.floor}º andar
          </Text>
        </View>

        {/* Linha de informações */}
        <View style={styles.infoRow}>
          <InfoChip icon="📅" texto={formatarData(item.entryAt)} />
          <InfoChip icon="⏱" texto={formatarDuracao(item.totalMinutes)} />
          <InfoChip icon="💰" texto={`R$ ${Number(item.totalAmount).toFixed(2)}`} destaque />
        </View>

        {/* Status do pagamento */}
        <View style={[styles.pagamentoBadge, { borderColor: corPag + '44', backgroundColor: corPag + '15' }]}>
          <Text style={[styles.pagamentoTexto, { color: corPag }]}>{labelPag}</Text>
          {item.payment?.method && (
            <Text style={styles.metodoPag}>via {item.payment.method}</Text>
          )}
        </View>
      </View>
    );
  };

  if (sessoes.length === 0 && !carregando) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioEmoji}>📋</Text>
        <Text style={styles.vazioTitulo}>Nenhuma sessão ainda</Text>
        <Text style={styles.vazioSub}>Seu histórico de estacionamentos aparecerá aqui.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Contador total */}
      {total > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalTexto}>{total} sessão{total !== 1 ? 'ões' : ''} no total</Text>
        </View>
      )}

      <FlatList
        data={sessoes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        onEndReached={() => carregarMais(pagina)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          carregando
            ? <ActivityIndicator color={Colors.blue} style={{ marginVertical: 20 }} />
            : fim && sessoes.length > 0
              ? <Text style={styles.fimLista}>— Fim do histórico —</Text>
              : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Chip de informação reutilizável
function InfoChip({ icon, texto, destaque = false }: { icon: string; texto: string; destaque?: boolean }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={[styles.chipTexto, destaque && { color: Colors.green, fontWeight: '700' }]}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bgPrimary },
  lista:      { padding: Spacing.md, gap: Spacing.sm },
  totalBar:   { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  totalTexto: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placa:       { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, fontVariant: ['small-caps'] },
  vaga:        { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoRow:     { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipIcon:    { fontSize: 13 },
  chipTexto:   { fontSize: FontSize.sm, color: Colors.textSecondary },
  pagamentoBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.sm,
  },
  pagamentoTexto: { fontSize: FontSize.sm, fontWeight: '600' },
  metodoPag:      { fontSize: FontSize.xs, color: Colors.textMuted },
  vazio: {
    flex: 1, backgroundColor: Colors.bgPrimary,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl,
  },
  vazioEmoji:  { fontSize: 56 },
  vazioTitulo: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  vazioSub:    { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  fimLista:    { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, marginVertical: 16 },
});
