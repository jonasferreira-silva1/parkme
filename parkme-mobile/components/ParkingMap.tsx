// =============================================================
// ParkingMap — Mapa SVG interativo do estacionamento
//
// Exibe todas as vagas de um andar como retângulos coloridos.
// As cores indicam o status em tempo real (via WebSocket).
// Ao tocar em uma vaga, pode exibir detalhes ou traçar rota.
// =============================================================

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Line } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { Vaga } from '../store/parkingStore';

// Dimensões de cada vaga no mapa SVG (em pixels)
const VAGA_LARGURA  = 55;
const VAGA_ALTURA   = 35;
const VAGA_MARGEM   = 6;
const VAGAS_POR_LINHA = 10;

// Calcula a cor de fundo da vaga baseada no status e tipo
function corDaVaga(vaga: Vaga): string {
  if (vaga.status === 'OCCUPIED') return Colors.spotOccupied;
  if (vaga.status === 'RESERVED') return Colors.spotReserved;

  // Vagas livres têm cores diferentes por tipo
  switch (vaga.type) {
    case 'DISABLED': return Colors.spotPcd;
    case 'VIP':      return Colors.spotVip;
    default:         return Colors.spotFree;
  }
}

// Retorna a sigla exibida no centro da vaga
function labelDaVaga(vaga: Vaga): string {
  if (vaga.status === 'OCCUPIED') return '🚗';
  if (vaga.type === 'DISABLED')   return '♿';
  if (vaga.type === 'VIP')        return '⭐';
  return `${vaga.sector}${vaga.number}`;
}

interface Props {
  vagas: Vaga[];
  vagaDestacada?: string;        // ID da vaga do usuário (fica pulsando)
  onVagaPress?: (vaga: Vaga) => void;
}

export function ParkingMap({ vagas, vagaDestacada, onVagaPress }: Props) {
  const larguraTela = Dimensions.get('window').width - 32;

  // Calcula dimensões do SVG baseado na quantidade de vagas
  const totalLinhas = Math.ceil(vagas.length / VAGAS_POR_LINHA);
  const alturaSvg = totalLinhas * (VAGA_ALTURA + VAGA_MARGEM) + 40;

  // Organiza as vagas em grid (linha × coluna)
  const vagasComPosicao = useMemo(() => {
    return vagas.map((vaga, index) => {
      const coluna = index % VAGAS_POR_LINHA;
      const linha  = Math.floor(index / VAGAS_POR_LINHA);

      return {
        ...vaga,
        x: coluna * (VAGA_LARGURA + VAGA_MARGEM),
        y: linha  * (VAGA_ALTURA  + VAGA_MARGEM) + 20,
      };
    });
  }, [vagas]);

  if (vagas.length === 0) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioTexto}>Nenhuma vaga encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Legenda de cores */}
      <View style={styles.legenda}>
        <LegendaItem cor={Colors.spotFree}     label="Livre" />
        <LegendaItem cor={Colors.spotOccupied} label="Ocupada" />
        <LegendaItem cor={Colors.spotReserved} label="Reservada" />
        <LegendaItem cor={Colors.spotVip}      label="VIP" />
        <LegendaItem cor={Colors.spotPcd}      label="PCD" />
      </View>

      {/* Mapa SVG das vagas */}
      <Svg
        width={larguraTela}
        height={alturaSvg}
        viewBox={`0 0 ${VAGAS_POR_LINHA * (VAGA_LARGURA + VAGA_MARGEM)} ${alturaSvg}`}
      >
        {/* Linha divisória de corredores entre setores */}
        {totalLinhas > 2 && (
          <Line
            x1={0}
            y1={(Math.floor(totalLinhas / 2)) * (VAGA_ALTURA + VAGA_MARGEM) + 10}
            x2={VAGAS_POR_LINHA * (VAGA_LARGURA + VAGA_MARGEM)}
            y2={(Math.floor(totalLinhas / 2)) * (VAGA_ALTURA + VAGA_MARGEM) + 10}
            stroke={Colors.border}
            strokeWidth={2}
            strokeDasharray={[6, 4]}
          />
        )}

        {/* Renderiza cada vaga */}
        {vagasComPosicao.map((vaga) => {
          const estaDestacada = vaga.id === vagaDestacada;
          const cor = corDaVaga(vaga);

          return (
            <G key={vaga.id}>
              {/* Área tocável invisível sobre a vaga */}
              <Rect
                x={vaga.x}
                y={vaga.y}
                width={VAGA_LARGURA}
                height={VAGA_ALTURA}
                rx={4}
                fill="transparent"
                onPress={() => onVagaPress?.(vaga)}
              />

              {/* Borda de destaque (vaga do usuário) */}
              {estaDestacada && (
                <Rect
                  x={vaga.x - 3}
                  y={vaga.y - 3}
                  width={VAGA_LARGURA + 6}
                  height={VAGA_ALTURA + 6}
                  rx={6}
                  fill="none"
                  stroke={Colors.yellow}
                  strokeWidth={2}
                />
              )}

              {/* Retângulo principal da vaga */}
              <Rect
                x={vaga.x}
                y={vaga.y}
                width={VAGA_LARGURA}
                height={VAGA_ALTURA}
                rx={4}
                fill={cor}
                opacity={vaga.status === 'OCCUPIED' ? 0.7 : 1}
              />

              {/* Texto/emoji da vaga */}
              <SvgText
                x={vaga.x + VAGA_LARGURA / 2}
                y={vaga.y + VAGA_ALTURA / 2 + 4}
                textAnchor="middle"
                fill="#fff"
                fontSize={vaga.status === 'OCCUPIED' ? 14 : 9}
                fontWeight={600}
              >
                {labelDaVaga(vaga)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// Componente pequeno para a legenda de cores
function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <View style={styles.legendaItem}>
      <View style={[styles.legendaPonto, { backgroundColor: cor }]} />
      <Text style={styles.legendaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendaPonto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendaLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  vazio: {
    padding: 32,
    alignItems: 'center',
  },
  vazioTexto: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
