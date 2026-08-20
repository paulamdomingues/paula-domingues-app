// Service worker MÍNIMO — 21/08/2026, adicionado só pra deixar o site
// "instalável" no Chrome/Android (o banner "Instalar aplicativo" que a
// Amanda viu num concorrente exige um service worker registrado com um
// listener de `fetch`, mesmo que ele não faça nada especial — ver
// https://web.dev/articles/install-criteria).
//
// De propósito NÃO fazemos cache de nada aqui — um service worker que
// guarda arquivos em cache pode deixar gente presa numa versão antiga e
// quebrada do site depois de um deploy nosso (um bug clássico de PWA:
// atualiza o código, mas quem já instalou continua vendo o HTML/JS velho
// até o cache expirar). Se um dia quisermos suporte offline de verdade,
// isso merece ser um projeto à parte, com estratégia de cache pensada,
// não um efeito colateral de "deixar instalável".
self.addEventListener('fetch', () => {
  // Handler vazio de propósito: sem `event.respondWith(...)`, o navegador
  // busca tudo normal na rede, exatamente como se não tivesse service
  // worker nenhum — a única razão dele existir é essa "assinatura" de
  // instalabilidade.
});
