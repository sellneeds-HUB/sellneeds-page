# SellNeeds — refatoração e auditoria técnica

**Atualização de domínio — 28/09/2026:** consulte [DOMINIO-E-INFRAESTRUTURA.md](docs/DOMINIO-E-INFRAESTRUTURA.md) para `www.sellneeds.com.br`, verificações atuais e pendências. A auditoria abaixo descreve a base de 25/09; orientações antigas de domínio/CORS devem ser lidas com a atualização. Os arquivos de execução permanecem idênticos ao pacote validado.

Revisão: 25/09/2026. Base direta: `index(1).html` fornecido pelo usuário, 93.445 bytes, SHA-256 `8dc9eefe2f19da16eb0ee1573a6c18007767290d45911e9e2a05eb4f52063fc1`.

Esta entrega é um frontend estático, sem framework, build, biblioteca de produção ou backend. Não foi publicada automaticamente. O HTML original foi mantido fora do pacote para comparação; não é necessário para executar a entrega.

## Diagnóstico atual

O arquivo analisado reunia um bloco `<style>` de 23.696 bytes, uma IIFE JavaScript e sete imagens WebP base64. As sete imagens somam 42.360 bytes binários. O CSS inclui regras sobrepostas de versões anteriores: a ordem da cascata é funcional e foi preservada integralmente, sem remoção de seletores, breakpoints ou animações.

O script usa `setOpen()` para alternar `.is-back`, acessibilidade e atividade orbital. `layout()` reposiciona o mesmo conteúdo entre esfera, `companySlot`, `statsSlot` e `linksPanel`; mede a geometria e calcula `radiusX`/`radiusY`. `draw()` e `animate()` apenas atualizam a órbita. Não havia leitura de geometria em cada quadro orbital no arquivo recebido; o `getBoundingClientRect()` existente é usado no evento de mouse para tilt. Não foi apresentado como uma correção nova.

As media queries de 860, 640, 430 px, as de altura 820/699 px e o modo desktop de 1024 × 700 px foram mantidos. No modo vertical, os botões precedem as estatísticas. No desktop, permanecem ao lado da esfera, após as informações da empresa.

**Não foi encontrada integração com Kaspersky no arquivo analisado.** Não foi removida uma integração inexistente. O problema observado anteriormente no arquivo publicado é separado desta auditoria do anexo limpo.

Não há `fetch`, XHR, WebSocket, formulário, login, banco de dados ou endpoint de API. Mercado Livre, Shopee e TikTok são destinos de navegação em `<a>`, não APIs consumidas pela aplicação. Não há fonte remota; a tipografia usa fontes do sistema.

## Problemas encontrados

| Constatação no código | Classificação | Tratamento |
| --- | --- | --- |
| HTML, CSS, script e imagens no mesmo documento | Acoplamento e manutenção, não vulnerabilidade por si só | Arquivos separados e nomes de assets identificáveis |
| Imagens em base64 vinculadas ao cache do documento | Limitação de cache e diffs extensos | Extração byte a byte em WebP, sem reconversão nem mudança visual |
| Ausência de CSP explícita no HTML | Ausência de defesa adicional, não prova de XSS | Meta CSP restritiva, logo após charset |
| `setOpen(true)` podia ocultar o ícone orbital ainda focado antes de transferir foco | Sequência de acessibilidade | Foco passa pela esfera antes de aplicar `inert`/`aria-hidden`; destino final continua sendo a loja correspondente |
| Seletor CSS montado com `item.dataset.brand` e uso do resultado sem verificação | Fragilidade de manutenção; dataset é estático, não entrada remota | Mapa dos três botões e verificação de existência |
| Elementos `div` dentro de botões nativos | Semântica HTML inadequada | `span` com as mesmas classes e estilos |
| Painel fechado aguardava JS para receber `inert` | Pequena janela de inconsistência semântica | Estado fechado inicial declarado no HTML |

**Nenhuma vulnerabilidade explorável de XSS, vazamento de segredo ou execução remota foi confirmada no escopo fornecido.** A revisão de um arquivo não certifica a segurança da conta GitHub, do dispositivo de publicação ou de sistemas não fornecidos.

## Riscos que não existem atualmente

A expressão “não existem” aqui significa **não foram encontrados no código auditado**, não uma garantia sobre outros componentes.

- Nenhuma ocorrência de `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, construtor `Function` ou `document.write`.
- Nenhuma leitura de parâmetros de URL, fragmentos para execução, conteúdo remoto ou mensagens `postMessage`.
- Nenhum fluxo identificado de dado controlado pelo visitante até um ponto de execução HTML/JS. A manipulação atual usa classes, atributos, propriedades CSS e movimentação de nós existentes.
- Nenhum token, credencial, chave de API ou secret identificado. Os identificadores de rastreamento nos links das lojas são parâmetros públicos, não credenciais.
- Nenhuma API interna, autenticação, sessão, armazenamento em `localStorage`/`sessionStorage`, dependência de CDN ou SDK externo.
- Os três `target="_blank"` já tinham `rel="noopener noreferrer"`; essa proteção foi mantida.
- SQL injection, autorização de endpoints, CSRF de operações autenticadas e vazamento de banco não são superfícies implementadas neste frontend. Passariam a exigir revisão se um backend fosse adicionado.

O destino TikTok é um link curto e pode redirecionar sob controle da plataforma. Os destinos foram preservados literalmente. Esta revisão não atesta todas as páginas futuras da cadeia de redirecionamento; o hub não oferece redirecionamento aberto baseado em parâmetros do visitante.

## Arquitetura proposta

`index.html` cuida da estrutura e da política declarativa. `css/style.css` mantém a cascata original. `js/script.js` mantém o controlador encapsulado em IIFE, com seções comentadas para estado/acessibilidade, layout, desenho, eventos e observação de dimensões. O mapa de plataformas faz a correspondência dos controles sem construir seletores a partir do dataset.

O JS externo usa `defer`: baixa durante a análise do HTML e executa com o DOM pronto. O CSS usa uma folha normal no `<head>` para evitar um primeiro quadro sem estilo; carregar a folha de forma artificialmente assíncrona poderia descaracterizar a entrada. As imagens mantêm dimensões explícitas e `decoding="async"`; a central mantém `fetchpriority="high"`.

### Assets e cache

As imagens são arquivos **locais ao projeto**, com bytes idênticos aos do anexo. Não foram usadas URLs externas, vetorização aproximada ou nova compressão. Imagens dos ícones orbitais e dos botões foram mantidas separadas porque seus arquivos/dimensões diferem: órbita 160 × 160, botões 80 × 80 e logo central 960 × 838.

Um carregamento frio pode solicitar dez recursos: HTML, CSS, JS e sete WebPs. A extração elimina o custo textual do base64 e permite cache independente. Há mais requisições do que na versão monolítica; a primeira visita pode ser afetada por latência, enquanto retornos e atualizações parciais podem aproveitar o cache. Não foi alegado um novo ganho de tempo sem medição desta versão separada. Os headers de cache são definidos pela hospedagem. Se houver nomes com hash no futuro, manter referências sincronizadas; não aplicar `immutable` a nomes estáveis que serão sobrescritos.

As setas SVG curtas permanecem inline: são ícones vetoriais simples, sem código, recursos remotos ou custo que justifique novos arquivos. Não foi criada uma pasta `assets/icons/` vazia.

## Correções implementadas

- Extração literal do CSS, preservando bytes e precedência.
- Extração do script, mantendo `setOpen`, `visibility`, `layout`, `draw`, `animate`, `restart` e os listeners existentes.
- Preservação de ângulo, velocidades, raios, tilt, transições, pausa, `requestAnimationFrame`, `ResizeObserver`, `matchMedia` e preferência por movimento reduzido.
- Correções pontuais de foco, verificação do botão-alvo e semântica dos botões; inclusão de landmark `main` sem alteração visual.
- Caminhos relativos `./css/style.css`, `./js/script.js` e `./assets/images/...`; nenhum caminho parte de `/css` ou `/assets`.
- CSP sem `unsafe-inline` ou `unsafe-eval`, e política de referrer global `no-referrer`.

### Política efetivamente aplicada

```text
default-src 'none'; script-src 'self'; script-src-attr 'none';
style-src 'self'; style-src-attr 'none'; img-src 'self';
font-src 'self'; connect-src 'none'; object-src 'none';
base-uri 'none'; form-action 'none'
```

A política está em meta após charset e antes de carregar CSS, JS e imagens. Permite os recursos da própria origem e bloqueia conexões de API, objetos, formulários, scripts inline e scripts remotos. `'self'` representa a origem, não apenas a pasta `/sellneeds-page/`: projetos no mesmo hostname compartilham essa fronteira. A integridade da conta e do repositório continua essencial.

As atribuições individuais a `element.style`/`style.setProperty()` utilizadas pela órbita continuam permitidas; isso foi testado no Chromium. Não se adicionou `style="..."`, `cssText`, handler inline ou injeção de HTML para contornar a política.

A CSP é defesa em profundidade: não esconde o código, não protege secrets colocados no frontend, não impede uma pessoa com acesso ao repositório de mudar a própria política e não garante controle de extensões/antivírus privilegiados. Não substitui autorização de uma API. Ao criar uma API futura, revisar `connect-src` para a origem exata necessária.

## Pontos que dependem do backend

**Não foi fornecido backend. Isso não pode ser determinado apenas pelo frontend.** Os itens abaixo são requisitos de projeto para uma eventual API; nenhum está implementado ou supostamente auditado em servidor existente.

### Autenticação, autorização e dados

Usar um provedor/protocolo estabelecido, com MFA para administração. Separar autenticação de autorização: cada ação deve verificar usuário, papel, organização e propriedade do objeto solicitado, negando por padrão. Ocultar um botão no frontend não limita acesso direto ao endpoint.

Validar no servidor tipos, tamanhos, enumerações, limites numéricos, campos permitidos e formato de arquivos; rejeitar campos inesperados. Preferir texto a HTML quando o conteúdo não precisa de marcação. Se HTML for necessário, usar sanitizador apropriado e codificação contextual na saída. Consultas a banco devem ser parametrizadas; limites de upload, corpo, paginação e duração precisam existir antes de executar trabalho caro.

Para sessões web, considerar cookies `HttpOnly`, `Secure` e `SameSite` apropriado ao fluxo, com proteção CSRF nas operações que usam cookies, rotação após autenticação, expiração e revogação. Não colocar tokens de longa duração em armazenamento legível por JS. Se JWT for escolhido, verificar assinatura, algoritmo permitido, emissor, audiência e expiração; planejar revogação e rotação. A arquitetura de autenticação final depende do fluxo, que ainda não foi fornecido.

Secrets pertencem a variáveis protegidas/gerenciador de segredos do servidor, com rotação e privilégios mínimos. Variáveis usadas por um build de frontend também podem terminar públicas. Logs devem registrar ID de correlação, rota, status, latência e decisões de acesso sem senhas, tokens ou conteúdo pessoal desnecessário. Respostas de erro devem ser estáveis e sem stack trace, SQL, caminhos internos ou detalhes de infraestrutura.

### CORS: sem necessidade no frontend atual

Não há API nem requisições cross-origin de dados. Links para lojas não precisam de CORS. O `Access-Control-Allow-Origin: *` observado na entrega pública do GitHub serve conteúdo estático público; não é evidência de exposição de uma API privada.

Se uma API for adicionada, o desenho recomendado é:

| Item | Configuração a decidir no backend |
| --- | --- |
| Origens | Lista explícita com `https://sellneeds-hub.github.io`; `/sellneeds-page/` não faz parte da origem CORS. Adicionar domínio próprio somente após definido. Não refletir qualquer `Origin`; rejeitar `null` quando não necessário. |
| Métodos | Somente os realmente implementados por rota; por exemplo, leitura não precisa autorizar escrita. Responder preflight `OPTIONS` de forma limitada. |
| Headers | Somente os necessários, como `Content-Type`, `Authorization` ou header CSRF se o desenho os usar. Não habilitar todos por conveniência. |
| Credenciais | Se cookies cross-origin forem indispensáveis, origem explícita e `Access-Control-Allow-Credentials: true`; nunca combinar com `*`. Sem necessidade de cookies, omitir credenciais. |
| Exposição de headers | Expor apenas os que o cliente precisa ler, por exemplo `Retry-After` se usado pela UI. |
| Cache | `Vary: Origin` quando a resposta CORS variar por origem; dados sensíveis não podem ir para cache público compartilhado. |
| Rejeição | Preflight com origem/método/header não autorizado não recebe permissão. Requisições sem autenticação/autorização continuam rejeitadas no servidor, independentemente de CORS. |

CORS controla o acesso de JavaScript à resposta no navegador. Não impede chamadas por clientes não navegador; algumas requisições simples podem chegar ao servidor mesmo quando a leitura da resposta é bloqueada. Não é autenticação, firewall nem proteção CSRF suficiente.

### Rate limiting por operação

O site atual não tem endpoint para limitar. Não foi adicionado um contador em JavaScript fingindo proteger o servidor. A política de uma futura API deve combinar identidade, custo e limites globais:

| Categoria futura | Chaves de limitação | Política e resposta sugeridas |
| --- | --- | --- |
| Público de leitura | IP validado + rota; teto global | Token bucket com burst compatível com abertura/paginação normal; cache na borda e limite de tamanho de resposta. |
| Autenticado | Usuário + organização + rota; IP secundário | Cota por identidade e orçamento compartilhado por organização; sessão pode complementar, nunca ser a única chave porque pode ser renovada. |
| Sensível | Usuário + ação + objeto | Burst pequeno, janela móvel e idempotência para impedir duplicações; reautenticação para ações críticas. |
| Administrativo | Administrador + ação; teto global | Autorização/MFA antes da operação, concorrência baixa por ação cara, auditoria e alerta; limitação não substitui o controle de acesso. |
| Busca | Usuário ou IP + custo da consulta | Token bucket com custo ponderado, debounce apenas na UX, limite de paginação/filtros e timeout do mecanismo de busca. |
| Login | Conta normalizada + IP/rede + padrão global | Janela móvel e atraso progressivo contra ataques distribuídos; mensagens neutras. Evitar bloqueio permanente de conta provocável por terceiros. |
| Recuperação de conta | Conta normalizada + IP + destino de envio | Cooldown, cota de mensagens e resposta que não revele se a conta existe; limites também nas tentativas do token. |
| Operação pesada | Usuário/organização + fila + concorrência global | Orçamento ponderado por custo, fila limitada, timeout e backpressure; leaky bucket pode suavizar vazão de trabalho com prazo de fila explícito. |

Não há quotas numéricas universais aprovadas para esta aplicação. Definir taxa de reposição, capacidade de burst, janela e simultaneidade a partir do tráfego legítimo, custo p95/p99 e teste do backend real. Separar janela curta de burst de cotas longas de abuso/orçamento. Token bucket permite rajadas controladas; leaky bucket suaviza saída, mas uma fila ilimitada apenas troca sobrecarga por atraso e consumo de memória.

Usar contadores atômicos em armazenamento compartilhado entre instâncias, com TTL e chave que inclua classe de operação e identidade. Limites apenas em memória de cada processo se multiplicam quando há várias réplicas. Cachear respostas idempotentes quando apropriado; não cobrar o mesmo trabalho novamente em retries protegidos por chave de idempotência.

Ao rejeitar excesso individual, responder HTTP `429` e `Retry-After` em segundos ou data válida, com erro padronizado e sem detalhes de contadores de outras contas. O cliente deve respeitar espera e aplicar backoff com jitter. Saturação geral pode exigir `503` e circuito de proteção, não falsamente atribuir tudo ao usuário. Decidir o comportamento quando o limitador falha: operações sensíveis devem preferir negar/adiar; leitura pública cacheável pode degradar de modo controlado.

Muitos compradores podem compartilhar um IP de operadora, empresa ou Wi-Fi. Evitar quotas rígidas exclusivamente por IP; combinar usuário autenticado, custo, IP e detecção de padrão. Sessões anônimas são renováveis. Limitar abuso distribuído por conta/ação, não apenas por IP. CAPTCHA ou desafio deve ser proporcional ao risco, com alternativa acessível, e não a única defesa. Não foi incluído CAPTCHA neste hub.

## Pontos que dependem da infraestrutura

### Proteção da origem e IP real

Não há endereço de backend próprio identificado no anexo. O hostname GitHub Pages é público por definição; seus IPs de CDN não são um servidor privado SellNeeds que este HTML possa esconder. Firewall, portas, DNS, subdomínios históricos e regras de proxy de uma origem própria **não foram fornecidos: isso não pode ser determinado apenas pelo frontend**.

Se existir uma origem própria no futuro:

1. Colocar o tráfego público atrás do proxy/CDN escolhido e manter TLS validado até a origem. Não considerar “IP fora do JS” uma proteção.
2. No firewall/security group, aceitar a porta de aplicação somente de proxies autorizados, rede privada ou túnel. Restringir acesso administrativo separadamente; banco, métricas e painéis não devem ficar em portas públicas.
3. Usar autenticação entre proxy e origem quando disponível, por exemplo mTLS/AOP com certificado apropriado à zona/hostname. Um certificado global de uma CDN pode provar apenas a rede da CDN, não a conta específica.
4. Auditar A/AAAA, registros não proxyados, subdomínios antigos e serviços de e-mail que compartilhem o IP. Histórico DNS pode continuar revelando um IP; proteger o acesso mesmo que ele seja conhecido.
5. Configurar a aplicação para confiar apenas em proxies conhecidos pelo endereço da conexão e pela topologia real. Não usar cegamente o primeiro `X-Forwarded-For` nem habilitar confiança universal em proxies. Parsear a cadeia a partir do lado confiável e encontrar o cliente conforme a topologia configurada.
6. Confiar em `CF-Connecting-IP` somente quando a conexão chegou por uma rota Cloudflare validada; remover/sobrescrever headers recebidos de origens não confiáveis. Tratar IPv6 e configurações de pseudo-IPv4. Usar o IP validado para logs e limites; IP não identifica por si só um usuário autenticado.
7. Reduzir headers com versões/stack interna quando controlável, mas reconhecer que isso não bloqueia acesso nem substitui atualização e firewall.

No GitHub Pages compartilhado não se configuram firewall da origem, portas nem confiança de proxy da aplicação. Colocar um domínio próprio na Cloudflare não fecha automaticamente a URL pública `github.io`. Para exigir acesso somente pelo proxy, será necessária hospedagem cuja origem permita esse controle. Não há Cloudflare implementada nesta entrega.

### Headers: o que existe e quem controla

Uma consulta HTTP HEAD ao endereço publicado em 25/09/2026 retornou `Server: GitHub.com`, `Content-Type: text/html; charset=utf-8`, `Access-Control-Allow-Origin: *`, `Strict-Transport-Security: max-age=31556952` e `Cache-Control: max-age=600`. Nessa resposta não apareceram CSP, Referrer-Policy, Permissions-Policy, X-Content-Type-Options ou X-Frame-Options. É uma observação pontual da URL publicada, não de todas as respostas/rotas e não prova a configuração após novo deploy.

| Mecanismo | Entrega atual / limitação |
| --- | --- |
| CSP | Meta implementada para os recursos posteriores a ela; não equivale a todos os recursos de um header HTTP. Em hospedagem controlável, preferir header. |
| Referrer-Policy | Meta `no-referrer` implementada; links mantêm `noreferrer`. Um header também pode definir política na resposta. |
| Permissions-Policy | Exige configuração HTTP para política do documento; não foi criado meta ineficaz. Se houver proxy, desabilitar câmera, microfone e geolocalização, que o hub não usa. |
| X-Content-Type-Options | `nosniff` depende de header e MIME correto para HTML/CSS/JS/WebP; meta não substitui. |
| frame-ancestors | Não funciona em meta CSP. Para impedir incorporação, usar CSP HTTP `frame-ancestors 'none'` no hosting/proxy; X-Frame-Options `DENY` pode complementar clientes antigos. Não foi fingida proteção anti-frame no HTML. |
| HSTS | Header HTTPS observado no hostname atual, controlado pelo GitHub. Em domínio próprio, validar todo HTTPS antes de definir duração, `includeSubDomains` ou preload; estes últimos não foram configurados. |

Não foi incluído `_headers` ou `.htaccess`: esses arquivos não configuram automaticamente headers no GitHub Pages público. Controle adicional pode exigir outro hosting ou proxy/CDN sob domínio administrado. Enviar um novo CSP HTTP junto do meta faz as políticas se combinarem de forma restritiva; mantê-las coerentes.

### Capacidade e usuários simultâneos

Não é possível fornecer um número confiável de usuários concorrentes. **Isso não pode ser determinado apenas pelo frontend.** O código não mantém conexão, polling ou sessão com a SellNeeds. Abrir/fechar a esfera, orbitar, mover o mouse e focar controles consomem CPU/GPU/memória no dispositivo do visitante. Clique na loja gera navegação para infraestrutura da plataforma externa.

O GitHub/CDN entrega arquivos; não executa `setOpen()` por visitante. Após os recursos carregados, um usuário parado na página não produz requisições recorrentes da aplicação. Futuras APIs, autenticação, geração de relatórios ou processamento mudariam esse perfil, mas não existem aqui.

| Métrica | Como medir / significado |
| --- | --- |
| Usuários ativos simultâneos | Definir janela e conceito de atividade; estimar com telemetria adequada ou sessões do backend, que hoje não existem. Conexões TCP não equivalem a usuários. |
| Requisições por segundo | Contar no edge/API por rota, método e status; distinguir hits/misses de cache, assets e operações de negócio. |
| Latência | Navegador: TTFB, FCP, LCP e INP; API futura: p50/p95/p99 e timeout por rota, região e cache. Não usar só média. |
| CPU/memória | No celular, profiler, tarefas longas, heap e frames; em origem própria, métricas do processo/container/host, GC e pressão de memória. Não há acesso às métricas internas dos servidores GitHub Pages neste projeto. |
| Conexões e filas | Em backend: conexões ativas, pool de banco, sockets, fila de jobs e espera por recurso. HTTP/2 multiplexa; contar conexões não conta requisições em andamento. |
| Erros | Separar 4xx de uso, 429 de limitação, 5xx, erros de rede, timeout e falhas de JS/CSP. |
| Saturação | Aumentar carga controladamente até vazão deixar de crescer, filas/latência/erros ultrapassarem SLOs; confirmar gargalo e verificar recuperação após reduzir carga. |

Em regime estável, requisições em andamento ≈ RPS × tempo médio de resposta em segundos; isso não é uma fórmula direta para “quantos usuários o site suporta”. Para usuários, também é necessário conhecer frequência de ações, tempo de permanência, cache e proporção de atividade. Não foram calculados números fictícios.

Os limites publicados do GitHub Pages, incluindo banda mensal e tamanho, não são garantia de simultaneidade. Conferir os termos de uso vigentes: o produto tem restrições para sites principalmente voltados a facilitar transações comerciais; este hub direciona a lojas e essa adequação deve ser avaliada. Checkout, dados sensíveis e API própria requerem arquitetura/hospedagem apropriadas; não foram implementados aqui.

### Estratégia de teste de carga

Nenhum teste de carga, stress ou saturação foi executado. Não há backend disponível. Os testes descritos em `docs/VALIDACAO.md` são de regressão funcional/visual e CSP; não medem capacidade de usuários.

Para um backend futuro, usar k6, Artillery, JMeter ou Gatling em ambiente correspondente, autorizado e com instrumentação. Começar por smoke para validar o cenário, depois carga esperada com ramp-up/patamar/ramp-down, stress incremental, spike e teste prolongado conforme o risco. Fixar previamente SLOs, critérios de interrupção e orçamento de serviços externos. Essas etapas são plano, não resultados.

Construir jornadas reais: visita fria/quente ao hub para estáticos; se criadas, leitura pública, busca, login, recuperação e operação pesada para API. Não disparar compras, e-mails reais nem carga sobre Mercado Livre/Shopee/TikTok. Mockar dependências quando o objetivo for medir a origem e testar separadamente a integração autorizada. Em testes de API, variar contas e IPs legitimamente e validar rate limits, sem removê-los para inflar capacidade.

Modelar tanto taxa de chegada quanto usuários virtuais, porque um modelo fechado pode reduzir o tráfego oferecido quando a API fica lenta e esconder saturação. Registrar vazão oferecida/aceita, erros, latências, recursos do servidor e se o próprio gerador saturou. Um script HTTP que baixa só `index.html` não executa a órbita nem carrega automaticamente todos os assets: incluir os recursos ou usar teste com navegador conforme o objetivo.

No GitHub Pages, limitar a verificação ao comportamento e desempenho autorizados da entrega; não tentar descobrir a capacidade do serviço compartilhado por stress indiscriminado. Para conhecer capacidade de uma API, o teste precisa ser realizado no ambiente dessa API.

## Estrutura final de arquivos

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura, ARIA inicial, CSP, referrer e referências relativas |
| `css/style.css` | CSS original integral |
| `js/script.js` | Estado, layout responsivo, órbita, foco, eventos e tilt |
| `assets/images/sellneeds.webp` | Logo central original extraída |
| `assets/images/*-orbita.webp` | Três logos orbitais originais extraídas |
| `assets/images/*-botao.webp` | Três logos dos botões originais extraídas |
| `README.md` | Diagnóstico, auditoria, arquitetura e publicação |
| `docs/assets-manifest.json` | Hash da origem e de cada imagem para rastreabilidade |
| `docs/VALIDACAO.md` | Testes realmente executados e limites da validação |
| `docs/validation-results.json` | Resumo estruturado da comparação e dos testes |

Não há diretório backend porque nenhum backend foi fornecido ou necessário ao funcionamento atual. Não há framework, `node_modules`, arquivo de secrets ou ferramenta de teste como dependência da página publicada.

## Checklist de segurança

- [x] Base auditada é o anexo fornecido, identificado por SHA-256.
- [x] Kaspersky, scripts remotos e dependências externas ausentes.
- [x] Sem sinks HTML/JS perigosos, entradas de URL ou credenciais identificadas.
- [x] Três destinos HTTPS, `target` e `rel` preservados.
- [x] CSP aplicada e testada sem liberar `unsafe-inline`/`unsafe-eval`.
- [x] Referências locais compatíveis com subdiretório GitHub Pages.
- [x] Foco, `inert`, ARIA, Escape, toque e movimento reduzido verificados.
- [ ] Anti-frame e demais headers adicionais: dependem de hosting/proxy.
- [ ] Segurança de conta/repositório, permissões de publicação e integridade do deploy: verificar operacionalmente; não auditadas pelo anexo.
- [ ] Backend, autorização, secrets, CORS de API, rate limiting e origem privada: não aplicáveis ao código atual; revisar ao criar esses componentes.

## Checklist para produção

1. Extraia o ZIP. Publique **o conteúdo** de `sellneeds-refatorado/` na raiz do repositório `sellneeds-page`, deixando `index.html`, `css/`, `js/` e `assets/` lado a lado. Não publique apenas o HTML separado.
2. Em GitHub → Settings → Pages, mantenha a origem de publicação já utilizada. Se usar branch, selecione a branch correta e a pasta `/(root)`. Se já houver workflow de Pages, mantenha-o apontando para este conteúdo, sem inventar um build necessário.
3. Faça commit dos arquivos e aguarde a publicação terminar. Não salve a página renderizada pelo navegador como código-fonte; envie os arquivos extraídos diretamente para evitar incorporar scripts injetados no dispositivo.
4. Abra `https://sellneeds-hub.github.io/sellneeds-page/`. Verifique respostas 200 para `css/style.css`, `js/script.js` e os sete WebPs, sem 404, erro de MIME ou violação CSP inesperada. A CSP desta refatoração exige publicação por HTTP/HTTPS; teste local por servidor, não apenas com duplo clique em `file://`.
5. Para servir localmente, dentro de `sellneeds-refatorado`, execute `python3 -m http.server 8000` e abra `http://localhost:8000/`. Para simular a URL de projeto, coloque essa pasta com o nome `sellneeds-page` sob a raiz servida e abra `/sellneeds-page/`.
6. Teste abertura/fechamento, cada loja, Escape, Tab/Enter, rotação da tela e preferência de movimento reduzido; inclua Android físico e Safari/iOS, que não foram usados nesta validação.
7. Consulte o código-fonte publicado e confirme a ausência de `kaspersky` e a presença das referências relativas. Reavalie a resposta HTTP real depois do deploy. Se houver cache antigo, teste janela privada e aguarde a atualização da CDN; não trate isso como nova alteração de design.
8. Mantenha MFA e acessos de publicação mínimos. Se houver domínio próprio, valide propriedade e DNS/TLS; se houver API futura, faça uma revisão específica antes de habilitar dados ou autenticação.

### Referências primárias consultadas

As referências apoiam as decisões de arquitetura; não significam que funcionalidades de backend tenham sido implementadas.

- [MDN — CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [MDN — style-src-attr e propriedades CSS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr)
- [MDN — frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [MDN — Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy)
- [MDN — CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [OWASP — REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [Cloudflare — proteção da origem](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/)
- [Cloudflare — Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/explanation/)
- [Cloudflare — headers e IP encaminhado](https://developers.cloudflare.com/fundamentals/reference/http-headers/)
- [GitHub — limites do Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub — criar site Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Grafana k6 — tipos de teste de carga](https://grafana.com/docs/k6/latest/testing-guides/test-types/)
