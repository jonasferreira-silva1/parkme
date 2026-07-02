// =============================================================
// ROOT LAYOUT — Layout raiz do Expo Router
//
// Define a estrutura de navegação global do app.
// Redireciona para login se não autenticado,
// ou para as tabs principais se já estiver logado.
// =============================================================

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { estaAutenticado } from '../services/api';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const [verificando, setVerificando] = useState(true);
  const [logado, setLogado] = useState(false);

  // Verifica se há token salvo ao abrir o app
  useEffect(() => {
    estaAutenticado()
      .then(setLogado)
      .finally(() => setVerificando(false));
  }, []);

  // Mostra spinner enquanto verifica autenticação
  if (verificando) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <>
      {/* Barra de status com estilo escuro */}
      <StatusBar style="light" backgroundColor={Colors.bgPrimary} />

      <Stack
        screenOptions={{
          headerStyle:      { backgroundColor: Colors.bgSecondary },
          headerTintColor:  Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle:     { backgroundColor: Colors.bgPrimary },
          // Animação de slide horizontal entre telas
          animation: 'slide_from_right',
        }}
        initialRouteName={logado ? '(tabs)' : '(auth)/login'}
      >
        {/* Grupo de telas sem header (login e registro) */}
        <Stack.Screen name="(auth)/login"    options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />

        {/* Tabs principais (header gerenciado pelo próprio tab navigator) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Tela de navegação interna com mapa e rota */}
        <Stack.Screen
          name="navigation/navigate"
          options={{
            title:         '🧭 Rota até sua vaga',
            headerShown:   true,
          }}
        />

        {/* Tela de pagamento — acessada após registrar saída */}
        <Stack.Screen
          name="payment"
          options={{
            title:       '💳 Pagamento',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
