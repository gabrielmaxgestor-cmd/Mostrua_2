Regras de Segurança para o Firestore (Trending System / Métricas)
===================================================================

Você deve adicionar este fragmento ao seu arquivo `firestore.rules` atual para acomodar o sistema de "Trending" e garantir a segurança atômica para os logs do catálogo e evitar manipulações cruzadas de outros usuários.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    // ... [Suas outras regras existentes] ...
    
    // Sistema de Métricas (Trending)
    // Caminho: /catalogs/{catalogId}/products/{productId}/stats/{statDoc}
    match /catalogs/{catalogId}/products/{productId}/stats/{statDoc} {
      
      // Permitir leitura pública (A vitrine de Trending precisa ler os mais acessados)
      allow read: if true;
      
      // Validação Atômica para Escrita
      allow create, update: if 
        // 1. O Payload contém SOMENTE pedidos de incremento e timer. Nada customizado.
        request.resource.data.diff(resource == null ? {} : resource.data).affectedKeys()
          .hasOnly(['views', 'orders', 'lastUpdated', 'productId', 'catalogId'])
        
        // 2. Garantir que os contadores são números (inteiros)
        && request.resource.data.views is number 
        && request.resource.data.orders is number
        
        // 3. Garantir Timestamp do Servidor Exato (Evitar spoofing temporal "last 7 days")
        && request.resource.data.lastUpdated == request.time
        
        // 4. Proteger a integridade da relação (Não pode trocar a métrica do Produto B para A)
        && request.resource.data.productId == productId
        && request.resource.data.catalogId == catalogId
        
        // 5. RESTRIÇÃO CRÍTICA (Incremento de Máximo 1 por requisição):
        // Se a operação for update, garante que a diferença entre o antigo e o novo não passe de +1 view e +1 order.
        && (
             request.method == 'create' || (
                 request.resource.data.views <= resource.data.views + 1
              && request.resource.data.orders <= resource.data.orders + 1
             )
           );
           
      // Deleção terminantemente proibida para clientes
      allow delete: if false; 
    }
  }
}
```
