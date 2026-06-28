// =============================================================
// TELA NAVEGAÇÃO INTERNA — Mapa com rota BFS animada
//
// Exibe o mapa do andar onde o carro está e traça a rota
// da entrada até a vaga usando o algoritmo BFS.
// =============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { useSessionStore } from '../../store/sessionStore';
import { useParkingStore } from '../../store/parkingStore';
import { ParkingMap } from '../../components/ParkingMap';
import { RouteOverlay } from '../../components/RouteOverlay';
import { FloorSelector } from '../../components/FloorSelector';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const LARGURA_TELA = Dimensions.get('window').width - 32;
// Ponto de entrada padrão do estacionamento (canto superior esquerdo do mapa)
const ENTRADA = { x: 10, y: 10 };

export default function NavigateScreen() {
  const { sessao } = useSessionStore();
  const { vagas, andarAtual, setAndar } = useParkingStore();

  // Andar do carro (calculado a partir da sessão)
  const andarCarro = sessao?.spot?.floor ?? 1;
  const [andarVisivel, setAndarVisivel] = useState(andarCarro);

  if (!sessao) {
    return (
      <View style={styles.semSessao}>
        <Text style={styles.semSessaoEmoji}>🧭</Text>
        <Text style={styles.semSessaoTexto}>Nenhum carro estacionado</Text>
      </View>
    );
  }

  const vagasDoAndar = vagas.filter((v) => v.floor === andarVisivel);

  // Calcula as dimensões do mapa para o overlay de rota
  const VAGAS_POR_LINHA = 10;
  const VAGA_LARGURA    = 55;
  const VAGA_ALTURA     = 35;
  const VAGA_MARGEM     = 6;
  const totalLinhas     = Math.ceil(vagasDoAndar.length / VAGAS_POR_LINHA);
  const alturaMap       = totalLinhas * (VAGA_ALTURA + VAGA_MARGEM) + 60;

  // Calcula a posição da vaga do usuário no grid
  const vagaUsuario = vagasDoAndar.find((v) => v.id === sessao.spot.id);
  const indexVaga   = vagasDoAndar.findIndex((v) => v.id === sessao.spot.id);
  const destinoPx   = vagaUsuario
    ? {
        x: (indexVaga % VAGAS_POR_LINHA) * (VAGA_LARGURA + VAGA_MARGEM) + VAGA_LARGURA / 2,
        y: Math.floor(indexVaga / VAGAS_POR_LINHA) * (VAGA_ALTURA + VAGA_MARGEM) + VAGA_ALTURA / 2 + 20,
      }
    : { x: 200, y: 100 }; // Fallback

  // Vagas ocupadas como obstáculos no BFS (exclui a vaga do usuário)
  const obstaculos = vagasDoAndar
    .filter((v) => v.status === 'OCCUPIED' && v.id !== sessao.spot.id)
    .map((_, i) => ({
      x: (i % VAGAS_POR_LINHA) * (VAGA_LARGURA + VAGA_MARGEM),
      y: Math.floor(i / VAGAS_POR_LINHA) * (VAGA_ALTURA + VAGA_MARGEM) + 20,
    }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Informações do destino */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>🎯 Seu destino</Text>
        <Text style={styles.infoDado}>
          Setor {sessao.spot.sector} · Vaga {sessao.spot.number} · {sessao.spot.floor}º andar
        </Text>
      </View>

      {/* Aviso se carro está em andar diferente */}
      {andarVisivel !== andarCarro && (
        <View style={styles.avisoAndar}>
          <Text style={styles.avisoTexto}>
            📍 Seu carro está no {andarCarro}º andar
          </Text>
        </View>
      )}

      {/* Seletor de andar */}
      <FloorSelector
        totalAndares={3}
        andarAtual={andarVisivel}
        onSelect={setAndarVisivel}
      />

      {/* Mapa com overlay de rota */}
      <View style={[styles.mapaWrapper, { height: alturaMap }]}>
        <ParkingMap
          vagas={vagasDoAndar}
          vagaDestacada={sessao.spot.id}
        />

        {/* Overlay BFS só aparece no andar do carro */}
        {andarVisivel === andarCarro && (
          <RouteOverlay
            largura={LARGURA_TELA}
            altura={alturaMap}
            origem={ENTRADA}
            destino={destinoPx}
            obstaculos={obstaculos}
          />
        )}
      </View>

      {/* Legenda da rota */}
      {andarVisivel === andarCarro && (
        <View style={styles.legenda}>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaPonto, { backgroundColor: Colors.green }]} />
            <Text style={styles.legendaTexto}>Entrada</Text>
          </View>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaLinha, { backgroundColor: Colors.blue }]} />
            <Text style={styles.legendaTexto}>Rota (BFS)</Text>
          </View>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaPonto, { backgroundColor: Colors.yellow }]} />
            <Text style={styles.legendaTexto}>Sua vaga</Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:    { padding: Spacing.md, gap: Spacing.md },
  semSessao: {
    flex: 1, backgroundColor: Colors.bgPrimary,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  semSessaoEmoji: { fontSize: 56 },
  semSessaoTexto: { color: Colors.textSecondary, fontSize: FontSize.md },
  infoCard: {
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    padding: Spacing.md, gap: 4,
  },
  infoLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoDado:  { color: Colors.blueLight, fontSize: FontSize.md, fontWeight: '700' },
  avisoAndar: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    padding: Spacing.sm,
  },
  avisoTexto: { color: Colors.yellow, fontSize: FontSize.sm },
  mapaWrapper: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, overflow: 'hidden',
  },
  legenda: {
    flexDirection: 'row', gap: Spacing.md, justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  legendaItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaPonto: { width: 10, height: 10, borderRadius: 5 },
  legendaLinha: { width: 20, height: 3, borderRadius: 2 },
  legendaTexto: { color: Colors.textSecondary, fontSize: FontSize.xs },
});
