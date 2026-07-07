// =============================================================
// TELA HOME — Mapa ao vivo do estacionamento
//
// Exibe todas as vagas em tempo real via WebSocket.
// Cores: verde = livre, vermelho = ocupado, amarelo = reservado.
// =============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import api from '../../services/api';
import { useParkingStore } from '../../store/parkingStore';
import { useSessionStore } from '../../store/sessionStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ParkingMap } from '../../components/ParkingMap';
import { FloorSelector } from '../../components/FloorSelector';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

// ID do estacionamento principal — em produção viria de seleção do usuário
const LOT_ID_PADRAO = 'lot_001';

export default function HomeScreen() {
  const { vagas, setVagas, andarAtual, setAndar, taxaOcupacao, setTaxaOcupacao, setCarregando, carregando } = useParkingStore();
  const { sessao } = useSessionStore();

  const [lotId, setLotId] = useState(LOT_ID_PADRAO);
  const [totalAndares, setTotalAndares] = useState(3);
  const [atualizando, setAtualizando] = useState(false);

  // Conecta ao WebSocket e atualiza vagas em tempo real
  useWebSocket({
    lotId,
    onSessaoExpirando: (dados) => {
      Alert.alert(
        '⏰ Atenção!',
        `Sua sessão vence em ${dados.minutesLeft} minutos.\nValor: R$ ${dados.totalAmount.toFixed(2)}`,
        [{ text: 'Ok, entendido' }],
      );
    },
  });

  const carregarVagas = useCallback(async () => {
    setCarregando(true);
    try {
      const resVagas = await api.get('/spots', { params: { lotId } });
      setVagas(resVagas.data);

      // Calcula taxa de ocupação localmente
      const total    = resVagas.data.length;
      const ocupadas = resVagas.data.filter((v: any) => v.status === 'OCCUPIED').length;
      setTaxaOcupacao(total > 0 ? Math.round((ocupadas / total) * 100) : 0);
    } catch (e) {
      console.error('Erro ao carregar vagas:', e);
    } finally {
      setCarregando(false);
    }
  }, [lotId]);

  useEffect(() => {
    carregarVagas();
  }, [carregarVagas]);

  // Vagas do andar atual para exibir no mapa
  const vagasDoAndar = vagas.filter((v) => v.floor === andarAtual);

  // Estatísticas rápidas
  const vagasLivres   = vagasDoAndar.filter((v) => v.status === 'FREE').length;
  const vagasOcupadas = vagasDoAndar.filter((v) => v.status === 'OCCUPIED').length;

  if (carregando && vagas.length === 0) {
    return <LoadingOverlay mensagem="Carregando mapa..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={async () => { setAtualizando(true); await carregarVagas(); setAtualizando(false); }}
            tintColor={Colors.blue}
            colors={[Colors.blue]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de status do estacionamento */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValor}>{vagasLivres}</Text>
            <Text style={styles.statusLabel}>Livres</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusValor, { color: Colors.red }]}>{vagasOcupadas}</Text>
            <Text style={styles.statusLabel}>Ocupadas</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusValor,
              { color: taxaOcupacao > 80 ? Colors.red : taxaOcupacao > 60 ? Colors.yellow : Colors.green }
            ]}>
              {taxaOcupacao}%
            </Text>
            <Text style={styles.statusLabel}>Ocupação</Text>
          </View>

          {/* Indicador de preço dinâmico */}
          {taxaOcupacao > 80 && (
            <View style={styles.precoDinamicoBadge}>
              <Text style={styles.precoDinamicoTexto}>💰 +20%</Text>
            </View>
          )}
        </View>

        {/* Alerta de sessão ativa */}
        {sessao && (
          <View style={styles.sessaoAtivaCard}>
            <Text style={styles.sessaoAtivaTexto}>
              🚗 Seu carro está na vaga {sessao.spot.sector}{sessao.spot.number} · {sessao.spot.floor}º andar
            </Text>
          </View>
        )}

        {/* Seletor de andar */}
        <View style={styles.secao}>
          <FloorSelector
            totalAndares={totalAndares}
            andarAtual={andarAtual}
            onSelect={setAndar}
          />
        </View>

        {/* Título do andar */}
        <Text style={styles.tituloAndar}>
          {andarAtual}º Andar — {vagasLivres} {vagasLivres === 1 ? 'vaga livre' : 'vagas livres'}
        </Text>

        {/* Mapa de vagas */}
        <View style={styles.mapaContainer}>
          <ParkingMap
            vagas={vagasDoAndar}
            vagaDestacada={sessao?.spot?.id}
            onVagaPress={(vaga) => {
              if (vaga.status === 'FREE') {
                Alert.alert(
                  `Vaga ${vaga.sector}${vaga.number}`,
                  `Tipo: ${vaga.type === 'STANDARD' ? 'Padrão' : vaga.type === 'DISABLED' ? 'PCD ♿' : 'VIP ⭐'}\nStatus: Livre ✅`,
                );
              }
            }}
          />
        </View>

        {/* Rodapé informativo */}
        <View style={styles.rodape}>
          <View style={styles.liveDot} />
          <Text style={styles.rodapeTexto}>Atualização em tempo real via WebSocket</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statusBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValor: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.green,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  precoDinamicoBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  precoDinamicoTexto: {
    color: Colors.red,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  sessaoAtivaCard: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  sessaoAtivaTexto: {
    color: Colors.blueLight,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  secao: {
    alignItems: 'flex-start',
  },
  tituloAndar: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  mapaContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  rodapeTexto: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
