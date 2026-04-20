import { auth } from "../firebase";

/**
 * Força a atualização do token do usuário atual para obter as Custom Claims mais recentes.
 * Útil logo após promover um usuário a admin ou revogar o acesso.
 */
export async function forceTokenRefresh(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Nenhum usuário autenticado.");
  }
  
  // O parâmetro true força o refresh do token ignorando o cache
  await currentUser.getIdToken(true);
}

/**
 * Verifica se o usuário atual possui a custom claim de admin.
 * @returns true se o usuário for admin, false caso contrário.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return false;
  }
  
  try {
    // Obtém o token result forçando o refresh para garantir que as claims estejam atualizadas
    const idTokenResult = await currentUser.getIdTokenResult(true);
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error("Erro ao verificar status de admin:", error);
    return false;
  }
}
