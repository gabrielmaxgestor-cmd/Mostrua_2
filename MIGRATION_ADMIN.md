# Migração de Autenticação de Admin para Firebase Custom Claims

Este guia descreve os passos necessários para migrar a autenticação de administrador do email hardcoded nas regras do Firestore para Firebase Custom Claims.

## Passos para Migração

### 1. Deploy das Cloud Functions
Primeiro, é necessário fazer o deploy das novas Cloud Functions que gerenciam as Custom Claims.

```bash
cd functions
npm install
npm run deploy
```

### 2. Conceder Acesso ao Primeiro Admin (Bootstrap)
Como as regras do Firestore agora exigem a claim `admin: true`, você precisa conceder essa claim ao seu usuário principal. Use a função `bootstrapFirstAdmin` via `curl` ou Postman.

Substitua `<SUA_REGION>`, `<SEU_PROJECT_ID>`, `<UID_DO_ADMIN>` e `<SEU_BOOTSTRAP_SECRET>` pelos valores reais do seu projeto. O `BOOTSTRAP_SECRET` deve ser configurado nas variáveis de ambiente da sua Cloud Function.

```bash
curl -X POST https://<SUA_REGION>-<SEU_PROJECT_ID>.cloudfunctions.net/bootstrapFirstAdmin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: <SEU_BOOTSTRAP_SECRET>" \
  -d '{"uid": "<UID_DO_ADMIN>"}'
```

### 3. Verificar no Firebase Console
Acesse o Firebase Console e verifique se o documento do usuário em `users/<UID_DO_ADMIN>` teve o campo `role` atualizado para `admin` (se você implementou a atualização do Firestore na função de bootstrap).
Para verificar a claim em si, você pode fazer login no app e verificar o token decodificado, ou usar o Firebase Admin SDK localmente.

### 4. Deploy das Novas Regras do Firestore
As regras do Firestore já foram atualizadas no arquivo `firestore.rules` para usar a nova função `isAdmin()`:

```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}
```

Faça o deploy das novas regras:

```bash
firebase deploy --only firestore:rules
```

### 5. Atualizar o App (Forçar Refresh)
Se o usuário admin já estiver logado no app, ele precisará fazer logout e login novamente, ou o app pode usar a função `forceTokenRefresh()` (em `src/utils/adminUtils.ts`) para forçar a atualização do token e obter a nova claim de admin.
