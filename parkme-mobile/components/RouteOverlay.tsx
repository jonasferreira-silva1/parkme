// =============================================================
// RouteOverlay — Rota animada sobre o mapa SVG usando BFS
//
// O algoritmo BFS (Busca em Largura) encontra o menor caminho
// da entrada até a vaga do usuário num grid de células.
// A rota é desenhada como uma linha pontilhada animada sobre o SVG.
// =============================================================

import React, { useMemo, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

// Tamanho de cada célula do grid de navegação
const CELULA = 20;

// Representa um ponto no grid
interface Ponto { x: number; y: number }

// =============================================================
// ALGORITMO BFS — Busca em Largura no grid do estacionamento
// Encontra o MENOR caminho entre dois pontos evitando obstáculos.
//
// Como funciona:
//   1. Começa no ponto de origem
//   2. Explora todos os vizinhos (cima, baixo, esquerda, direita)
//   3. Marca cada célula visitada para não voltar
//   4. Para quando chega no destino
//   5. Reconstrói o caminho de trás para frente
// =============================================================
function bfs(
  origem: Ponto,
  destino: Ponto,
  obstaculos: Ponto[],
  larguraGrid: number,
  alturaGrid: number,
): Ponto[] {
  // Converte lista de obstáculos em Set para busca O(1)
  const bloqueados = new Set(obstaculos.map((p) => `${p.x},${p.y}`));

  // Fila do BFS (FIFO) — começa com a origem
  const fila: Ponto[] = [origem];

  // Mapa de onde cada célula foi visitada (para reconstruir o caminho)
  const visitados = new Map<string, Ponto | null>();
  visitados.set(`${origem.x},${origem.y}`, null);

  // Direções possíveis de movimento (4 direções ortogonais)
  const direcoes: Ponto[] = [
    { x: 0,  y: -1 }, // cima
    { x: 0,  y:  1 }, // baixo
    { x: -1, y:  0 }, // esquerda
    { x:  1, y:  0 }, // direita
  ];

  while (fila.length > 0) {
    const atual = fila.shift()!;
    const chaveAtual = `${atual.x},${atual.y}`;

    // Chegou ao destino — reconstrói o caminho
    if (atual.x === destino.x && atual.y === destino.y) {
      const caminho: Ponto[] = [];
      let pos: string | null = chaveAtual;

      while (pos !== null) {
        const [cx, cy] = pos.split(',').map(Number);
        caminho.unshift({ x: cx, y: cy });
        const anterior = visitados.get(pos);
        pos = anterior ? `${anterior.x},${anterior.y}` : null;
      }

      return caminho;
    }

    // Explora os vizinhos
    for (const dir of direcoes) {
      const vizinho: Ponto = { x: atual.x + dir.x, y: atual.y + dir.y };
      const chaveVizinho = `${vizinho.x},${vizinho.y}`;

      // Verifica limites do grid
      if (vizinho.x < 0 || vizinho.y < 0 || vizinho.x >= larguraGrid || vizinho.y >= alturaGrid) {
        continue;
      }

      // Ignora células já visitadas ou bloqueadas
      if (visitados.has(chaveVizinho) || bloqueados.has(chaveVizinho)) {
        continue;
      }

      visitados.set(chaveVizinho, atual);
      fila.push(vizinho);
    }
  }

  // Sem caminho encontrado — retorna linha reta como fallback
  return [origem, destino];
}

interface Props {
  largura: number;   // Largura do SVG em pixels
  altura:  number;   // Altura do SVG em pixels
  origem:  Ponto;    // Ponto de entrada do estacionamento
  destino: Ponto;    // Posição da vaga do usuário
  obstaculos?: Ponto[]; // Posições das vagas ocupadas (não pode passar por cima)
}

export function RouteOverlay({ largura, altura, origem, destino, obstaculos = [] }: Props) {
  // Dimensões do grid em células
  const larguraGrid = Math.ceil(largura / CELULA);
  const alturaGrid  = Math.ceil(altura  / CELULA);

  // Converte coordenadas de pixel para coordenadas de grid
  const origemGrid  = { x: Math.floor(origem.x  / CELULA), y: Math.floor(origem.y  / CELULA) };
  const destinoGrid = { x: Math.floor(destino.x / CELULA), y: Math.floor(destino.y / CELULA) };
  const obsGrid     = obstaculos.map((o) => ({ x: Math.floor(o.x / CELULA), y: Math.floor(o.y / CELULA) }));

  // Calcula o caminho via BFS (só recalcula quando origem/destino mudam)
  const caminhoCelulas = useMemo(
    () => bfs(origemGrid, destinoGrid, obsGrid, larguraGrid, alturaGrid),
    [origem.x, origem.y, destino.x, destino.y],
  );

  // Converte o caminho de volta para pixels (centro de cada célula)
  const pontosPixel = caminhoCelulas.map((p) => ({
    x: p.x * CELULA + CELULA / 2,
    y: p.y * CELULA + CELULA / 2,
  }));

  // Formata os pontos para o atributo `points` do SVG Polyline
  const pontosStr = pontosPixel.map((p) => `${p.x},${p.y}`).join(' ');

  // Animação de "marcha" na linha pontilhada
  const animacao = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animacao, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  return (
    <Svg width={largura} height={altura} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Linha da rota com traços animados */}
      <Polyline
        points={pontosStr}
        fill="none"
        stroke={Colors.blue}
        strokeWidth={3}
        strokeDasharray="10,6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />

      {/* Ponto de origem (entrada) */}
      <Circle
        cx={pontosPixel[0]?.x ?? 0}
        cy={pontosPixel[0]?.y ?? 0}
        r={8}
        fill={Colors.green}
        stroke={Colors.bgPrimary}
        strokeWidth={2}
      />

      {/* Ponto de destino (vaga) — pisca para chamar atenção */}
      <Circle
        cx={pontosPixel[pontosPixel.length - 1]?.x ?? 0}
        cy={pontosPixel[pontosPixel.length - 1]?.y ?? 0}
        r={10}
        fill={Colors.yellow}
        stroke={Colors.bgPrimary}
        strokeWidth={2}
        opacity={0.9}
      />
    </Svg>
  );
}
