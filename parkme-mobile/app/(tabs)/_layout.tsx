// =============================================================
// TABS LAYOUT — Barra de navegação inferior do app
// =============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors, FontSize } from '../../constants/theme';

// Ícones simples com emoji para evitar dependência de biblioteca
function IconeTab({ emoji, size }: { emoji: string; size: number }) {
  return <Text style={{ fontSize: size }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Estilo da barra inferior
        tabBarStyle: {
          backgroundColor:  Colors.bgSecondary,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          height:           64,
          paddingBottom:    10,
          paddingTop:       6,
        },
        tabBarActiveTintColor:   Colors.blue,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize:   FontSize.xs,
          fontWeight: '600',
        },
        // Estilo do header de cada tela
        headerStyle:      { backgroundColor: Colors.bgSecondary },
        headerTintColor:  Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: FontSize.md },
      }}
    >
      {/* Tela 1: Mapa ao vivo */}
      <Tabs.Screen
        name="index"
        options={{
          title:     'Mapa',
          tabBarIcon: ({ size }) => <IconeTab emoji="🗺️" size={size} />,
          headerTitle: '🅿️ ParkMe — Mapa ao vivo',
        }}
      />

      {/* Tela 2: Meu Carro / Sessão ativa */}
      <Tabs.Screen
        name="my-car"
        options={{
          title:     'Meu Carro',
          tabBarIcon: ({ size }) => <IconeTab emoji="🚗" size={size} />,
          headerTitle: 'Meu Carro',
        }}
      />

      {/* Tela 3: Histórico de sessões */}
      <Tabs.Screen
        name="history"
        options={{
          title:     'Histórico',
          tabBarIcon: ({ size }) => <IconeTab emoji="📋" size={size} />,
          headerTitle: 'Histórico de sessões',
        }}
      />

      {/* Tela 4: Perfil e configurações */}
      <Tabs.Screen
        name="profile"
        options={{
          title:     'Perfil',
          tabBarIcon: ({ size }) => <IconeTab emoji="👤" size={size} />,
          headerTitle: 'Meu Perfil',
        }}
      />

      {/* Telas auxiliares — sem tab visível na barra inferior */}
      <Tabs.Screen
        name="add-vehicle"
        options={{
          title:          'Cadastrar Veículo',
          headerTitle:    '🚗 Cadastrar veículo',
          href:           null, // Esconde da barra de tabs
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title:       'Registrar Entrada',
          headerTitle: '🅿️ Registrar entrada',
          href:        null, // Esconde da barra de tabs
        }}
      />
    </Tabs>
  );
}
