import * as SecureStore from 'expo-secure-store';

export const CHAVE_ACCESS_TOKEN  = 'parkme_access_token';
export const CHAVE_REFRESH_TOKEN = 'parkme_refresh_token';

/** Salva os tokens JWT no armazenamento seguro do dispositivo */
export async function salvarTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(CHAVE_ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(CHAVE_REFRESH_TOKEN, refreshToken),
  ]);
}

/** Remove os tokens (logout) */
export async function limparTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(CHAVE_ACCESS_TOKEN),
    SecureStore.deleteItemAsync(CHAVE_REFRESH_TOKEN),
  ]);
}

/** Verifica se o usuário está autenticado (tem access token) */
export async function estaAutenticado(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(CHAVE_ACCESS_TOKEN);
  return !!token;
}
