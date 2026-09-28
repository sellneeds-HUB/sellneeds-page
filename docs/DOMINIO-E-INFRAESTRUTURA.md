# SellNeeds — domínio, frontend e infraestrutura

Atualização: 28/09/2026. Base: versão persistida de `sellneeds-refatorado.zip`. Esta revisão conserva integralmente os bytes de `index.html`, `css/style.css`, `js/script.js` e dos sete WebPs; acrescenta orientações de implantação. Os testes visuais de 25/09 permanecem registrados como testes anteriores, não como novos testes executados hoje.

## Parte 1 — Origem, backend e infraestrutura

### Resultado verificado hoje

| Endereço | Observação desta execução |
| --- | --- |
| `http://www.sellneeds.com.br/` | HTTP 200, identificação `Server: GitHub.com`, sem redirecionamento observado no HEAD |
| `https://www.sellneeds.com.br/` | HTTP 200 com TLS aceito pelo cliente de teste, identificação `Server: GitHub.com` |
| `https://sellneeds.com.br/` | Timeout após 20 segundos; não demonstra, sozinho, causa DNS ou indisponibilidade para todos os usuários |

As respostas sugerem GitHub Pages, coerente com a hospedagem anterior. Não comprovam a configuração completa de DNS/CDN. Não foram feitos varredura de portas, inventário de subdomínios ou teste de carga. Não houve alteração no site publicado, DNS, GitHub, firewall ou CDN.

**Não há backend/API no projeto fornecido.** Não existe IP de servidor próprio identificado no código para proteger por firewall. IPs públicos da infraestrutura compartilhada do GitHub não equivalem a uma origem privada da SellNeeds. Ocultar IP em HTML, cabeçalhos ou DNS não impede acesso à origem caso seu endereço seja conhecido.

### Arquitetura enxuta recomendada

Para o hub atual: navegador → HTTPS em `www.sellneeds.com.br` → hospedagem estática/CDN. Não há necessidade de criar servidor, autenticação, banco ou uma API apenas para exibir a esfera e os links.

Se controle de headers, WAF e limites de borda for requisito obrigatório, escolher uma hospedagem estática/CDN que ofereça esses controles ou um proxy administrado. Só adicionar Cloudflare após confirmar a conta, os nameservers e o plano disponível. Colocá-la diante do GitHub Pages não permite configurar o firewall do GitHub nem torna automaticamente inacessível a origem pública do Pages.

Se futuramente existir API própria: navegador → proxy/CDN → API privada. Para reduzir exposição, considerar túnel de saída ou rede privada; se a origem precisar de entrada pública, permitir apenas redes atualizadas do proxy/CDN na porta de serviço e autenticar a ligação com mTLS quando aplicável. Restringir administração por acesso privado, mantendo acesso de manutenção antes de alterar o firewall. Não habilitar banco, métricas ou painel administrativo em portas públicas.

Revisar registros A/AAAA/CNAME e serviços que compartilhem a origem; DNS histórico pode continuar revelando IPs. A restrição de acesso deve funcionar mesmo com IP conhecido. Revisar mensagens de erro e headers para não revelar endereços internos, caminhos e versões desnecessárias. Não ocultar diagnósticos nos logs internos protegidos.

### Rate limiting e concorrência — somente se houver API/origem controlável

| Alvo | Política recomendada, ainda não configurada |
| --- | --- |
| Arquivos estáticos | Cache na CDN; proteção de abuso na borda. Não aplicar o limite de login a cada imagem/CSS. |
| Rotas públicas de API | Token bucket por IP validado + rota, com burst e teto global definidos por medição. |
| Rotas autenticadas | Limite por usuário/organização + rota; IP como sinal complementar. |
| Login/recuperação | Limites combinados por conta e IP, janela móvel, cooldown temporário e respostas sem enumeração de contas. |
| Rotas sensíveis/administrativas | Autorizar primeiro; limites por identidade/ação, MFA e registro de auditoria. |
| Busca e trabalho pesado | Custo ponderado, timeout, fila limitada e teto de jobs concorrentes; rejeitar antes de consumir o recurso caro. |

Responder `429` e `Retry-After` ao exceder uma cota; aplicar cooldown graduado para abuso e retorno automático. Não definir bloqueio permanente de conta provocável por terceiros. Sob saturação geral, considerar `503` e backpressure. Coordenar limites entre réplicas com armazenamento atômico compartilhado. Os valores dependem de tráfego legítimo, custo e capacidade medida; não há quotas reais configuradas nesta entrega.

Confiar em `X-Forwarded-For`/`CF-Connecting-IP` apenas quando a conexão vier de proxies explicitamente confiáveis. Não usar arbitrariamente o primeiro IP da cadeia. Normalizar IPv4/IPv6, sobrescrever headers não confiáveis e validar a topologia. Muitos usuários podem compartilhar o mesmo IP: não equiparar IP a pessoa.

Limitar conexões concorrentes também não limita pessoas. HTTP/2 multiplexa requisições; um visitante pode abrir várias conexões ou ficar com a página aberta sem novas requisições. Neste hub, animações e cliques não chamam servidor próprio após os recursos carregarem. Para medir visitas ativas, definir uma janela de atividade e escolher telemetria agregada na borda ou analytics com critérios de privacidade; requisições de assets não contam pessoas únicas. Não foi adicionado rastreamento ou heartbeat.

Se uma API existir, medir RPS, p95/p99, erros, 429, CPU, memória, conexões de banco e tamanho/espera de filas. Usar testes autorizados de smoke, carga progressiva, pico e duração no ambiente correspondente. Capacidade e quantidade de usuários: **isso não pode ser determinado apenas pelo frontend**. Nenhum teste de carga foi executado.

### Ações fora do código

1. Confirmar o domínio principal `www.sellneeds.com.br` e a continuidade no GitHub Pages.
2. Se permanecer no GitHub, verificar o domínio na conta, configurar Custom domain e ativar **Enforce HTTPS**. Confirmar redirecionamento HTTP → HTTPS, sem loop.
3. Revisar o domínio sem `www` no provedor DNS e decidir seu redirecionamento para `https://www.sellneeds.com.br/`. Não copiar IPs ou alterar registros sem conferir os existentes.
4. Preservar o arquivo `CNAME` já configurado no repositório, caso exista. Se inexistente e confirmado o GitHub Pages, ele deve conter somente `www.sellneeds.com.br`, sem protocolo ou caminho. Não foi criado automaticamente no pacote, pois a configuração de publicação ainda precisa ser confirmada.
5. Caso uma CDN/proxy seja escolhida, validar TLS até a origem, cache, headers, logs e bloqueio de acesso direto conforme o tipo de hospedagem. Não prometer firewall customizado para origem GitHub compartilhada.

## Parte 2 — Segurança essencial do frontend

- Sem scripts ou API Kaspersky. O script identificado na publicação antiga era uma inclusão externa associada ao Kaspersky; não era necessário ao hub nem constituía proteção da aplicação. Não foi encontrada integração com Kaspersky no pacote analisado.
- Sem `innerHTML`, `eval`, `document.write`, dados remotos, parâmetros de URL processados, credenciais ou tokens. Não foi criada sanitização fictícia de entradas que não existem. Para texto dinâmico futuro, preferir `textContent`, validar tipos/tamanhos e permitir apenas URLs/protocolos esperados. HTML de terceiros exigirá sanitizador adequado; validação de dados sensíveis também deve ocorrer no servidor.
- CSP existente preservada: recursos locais permitidos, `connect-src 'none'`, scripts inline/externos não autorizados bloqueados, sem `unsafe-inline`/`unsafe-eval`. Não há endpoints, limites ou segredos disfarçados no navegador.
- CORS não é configurado pelo HTML. Não há API que precise dele hoje. Se uma API for criada, autorizar no servidor a origem exata `https://www.sellneeds.com.br` e apenas métodos/headers necessários. Autorizar `https://sellneeds.com.br` somente se realmente servir o frontend; a URL antiga GitHub não deve permanecer autorizada por hábito. Origem CORS não contém caminho.
- Não refletir origens arbitrárias. Credenciais somente quando o desenho as exigir; nunca combinar credenciais com `Access-Control-Allow-Origin: *`. CORS restringe leitura pelo navegador, não autentica chamadas nem substitui CSRF, autorização ou firewall.

### Headers sugeridos para hosting/proxy controlável

Exemplo a aplicar **fora do HTML**, após confirmar a plataforma; não é configuração ativa:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

Validar MIME dos recursos antes de `nosniff`. HSTS deve ser decidido após validar HTTPS e renovação do certificado; iniciar conforme política de operação e não ativar `includeSubDomains`/preload sem revisar todos os subdomínios. Não há header HSTS customizado aplicado por esta entrega.

A meta CSP e a meta de referrer já estão no HTML. `frame-ancestors`, Permissions-Policy, nosniff e HSTS exigem headers adequados; um meta não os substitui. Não foi criado `_headers` ou `.htaccess` fingindo configurar GitHub Pages. A política de CSP não garante controle sobre software privilegiado no dispositivo ou acesso comprometido ao repositório.

## Parte 3 — Arquivos e preservação

Foi mantido o padrão pedido:

- `index.html`
- `css/style.css`
- `js/script.js`
- `assets/images/` com os sete logos originais
- `README.md` e documentação em `docs/`

CSS e JS não foram duplicados na raiz. As referências `./css/style.css`, `./js/script.js` e `./assets/images/...` funcionam tanto na raiz do domínio quanto em `/sellneeds-page/`. O script usa `defer`.

Não há bloco `<style>`, script inline, handler `onclick` ou atributo HTML `style`. As atualizações de propriedades CSS feitas pelo JS para animação/tilt são runtime CSSOM e permanecem necessárias. As setas SVG inline são marcação vetorial, não JavaScript ou folha CSS inline.

Não foram alterados aparência, imagens, estados, lógica orbital, foco, links ou breakpoints. A identidade de todos os arquivos de execução em relação ao ZIP-base foi verificada por SHA-256 em 28/09. O pacote contém os assets necessários: os três arquivos de código sozinhos não incluem as imagens.

## Informações necessárias para configurar a infraestrutura de verdade

- A hospedagem continuará no GitHub Pages ou existe VPS/servidor/API próprio?
- Onde o DNS de `sellneeds.com.br` é administrado? Há conta Cloudflare e zona já configurada?
- Se houver backend: provedor, linguagem, topologia do proxy, portas e forma de administração. Não enviar senhas, chaves ou tokens em mensagens.

Sem esses dados e acesso autorizado aos painéis, firewall, CDN, rate limits e redirecionamentos permanecem recomendações pendentes. O frontend está pronto para a estrutura atual.

## Fontes oficiais

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- https://developers.cloudflare.com/tunnel/
- https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/

As instruções são condicionais à plataforma confirmada; não indicam adoção de Cloudflare nem uma integração de backend existente.
