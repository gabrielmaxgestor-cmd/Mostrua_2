// ─────────────────────────────────────────────────────────────────────────────
// Mostrua — Regras de segurança do Firestore
// Adicione este bloco às suas rules existentes.
// ─────────────────────────────────────────────────────────────────────────────

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ───────────────────────────────────────────────────────────────

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function belongsToReseller(resellerId) {
      return isAuthenticated() && request.auth.uid == resellerId;
    }

    // ── Support Tickets ───────────────────────────────────────────────────────

    match /support_tickets/{ticketId} {

      // Leitura: admin vê tudo; revendedor só vê os próprios
      allow read: if isAdmin()
                  || belongsToReseller(resource.data.resellerId);

      // Criação: qualquer usuário autenticado, mas o resellerId deve bater com uid
      allow create: if isAuthenticated()
                    && request.resource.data.resellerId == request.auth.uid
                    && request.resource.data.keys().hasAll([
                         'resellerId', 'resellerName', 'resellerEmail',
                         'subject', 'status', 'priority',
                         'createdAt', 'updatedAt', 'lastMessageAt',
                         'unreadAdmin', 'unreadReseller'
                       ]);

      // Update: admin pode tudo; revendedor não pode alterar status/priority
      allow update: if isAdmin()
                    || (belongsToReseller(resource.data.resellerId)
                        && !request.resource.data.diff(resource.data).affectedKeys()
                             .hasAny(['status', 'priority', 'resellerId']));

      // Delete: apenas admin
      allow delete: if isAdmin();

      // ── Messages sub-collection ───────────────────────────────────────────

      match /messages/{messageId} {

        // Leitura: admin ou revendedor dono do ticket
        allow read: if isAdmin()
                    || belongsToReseller(
                         get(/databases/$(database)/documents/support_tickets/$(ticketId)).data.resellerId
                       );

        // Criação: autenticado + sender deve ser o próprio usuário
        allow create: if isAuthenticated()
                      && request.resource.data.senderId == request.auth.uid
                      && request.resource.data.keys().hasAll([
                           'senderId', 'senderRole', 'senderName',
                           'content', 'createdAt', 'read'
                         ]);

        // Update: apenas marcar como lido (somente o campo 'read')
        allow update: if isAuthenticated()
                      && request.resource.data.diff(resource.data).affectedKeys()
                           .hasOnly(['read']);

        allow delete: if isAdmin();
      }
    }

    // ── Reseller notifications sub-collection ─────────────────────────────────

    match /resellers/{resellerId}/notifications/{notificationId} {
      // Revendedor lê as próprias; admin lê todas
      allow read: if isAdmin() || belongsToReseller(resellerId);

      // Somente admin cria
      allow create: if isAdmin();

      // Revendedor só pode marcar como lido; admin pode tudo
      allow update: if isAdmin()
                    || (belongsToReseller(resellerId)
                        && request.resource.data.diff(resource.data).affectedKeys()
                             .hasOnly(['read']));

      allow delete: if isAdmin();
    }
  }
}
