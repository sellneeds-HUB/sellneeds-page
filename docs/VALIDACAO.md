# Validação executada — 25/09/2026

## Escopo e ambiente

Comparação direta com `index(1).html`, usando Chromium headless via Playwright e servidor HTTP local. A versão refatorada foi servida em `/sellneeds-page/`, reproduzindo a base relativa do GitHub Pages. O original foi servido em `/original/` no mesmo servidor e navegador. Nenhum teste de carga foi realizado e nenhum resultado mede capacidade do GitHub Pages.

## Comparação visual

Foram feitas 22 comparações: estado fechado e aberto em 11 tamanhos. Para obter imagens determinísticas, as capturas usaram `prefers-reduced-motion: reduce`. A animação ativa foi testada separadamente. CSS integral e todos os bytes de imagem são idênticos à origem.

| Largura × altura | Fechado | Aberto |
| --- | --- | --- |
| 320 × 568 | Pixels idênticos | Pixels idênticos |
| 375 × 667 | Pixels idênticos | Pixels idênticos |
| 390 × 844 | Pixels idênticos | Pixels idênticos |
| 430 × 932 | Pixels idênticos | Pixels idênticos |
| 768 × 1024 | Pixels idênticos | Pixels idênticos |
| 1024 × 700 | Pixels idênticos | Pixels idênticos |
| 1280 × 720 | Pixels idênticos | Pixels idênticos |
| 1440 × 800 | Pixels idênticos | 5 pixels com diferença máxima de 1/255 por canal |
| 1920 × 1080 | Pixels idênticos | 4 pixels com diferença máxima de 1/255 por canal |
| 2560 × 1440 | Pixels idênticos | 5 pixels com diferença máxima de 1/255 por canal |
| 900 × 500 | Pixels idênticos | Pixels idênticos |

Todos os casos têm as mesmas dimensões de captura. As diferenças residuais são mínimas diferenças de rasterização; não foram detectadas mudanças de layout. As capturas mobile e desktop também foram inspecionadas visualmente. Não houve overflow horizontal nos casos testados e as sete imagens carregaram corretamente.

## Comportamento e segurança

- `node --check` passou para o JavaScript extraído.
- Enter abre a esfera; Escape fecha e restaura foco quando necessário.
- Os três ícones orbitais focados e ativados por Enter levam ao botão da plataforma correspondente.
- `inert` acompanha o estado fechado/aberto do painel de lojas.
- `target="_blank"`, `noopener noreferrer` e URLs originais preservados.
- A órbita se move com movimento habilitado e para ao mudar a preferência para movimento reduzido durante a sessão.
- `pointerenter` pausa a órbita; `pointerleave` retoma; tilt responde ao mouse e retorna a zero ao sair.
- Toque abre/fecha em emulação Pixel 5.
- Nenhum erro JavaScript foi observado na suíte de regressão.
- Nenhuma violação CSP ocorreu no funcionamento normal. A manipulação CSSOM da animação foi compatível com a política.
- Um teste negativo inseriu deliberadamente um elemento `script` com texto inline na página de teste: a CSP impediu sua execução. Esse script de teste não está no projeto entregue.
- Imagens extraídas têm hashes registrados em `assets-manifest.json`; nenhuma recompressão foi feita.

## Limites

Não foram testados Android físico, Safari/iOS, leitores de tela, todas as combinações de zoom/fonte do sistema ou uma implantação nova em produção. Os 22 casos não constituem prova para todo navegador e viewport possível. O contraste foi preservado, sem alegação de certificação WCAG completa. A suíte não constitui pentest de backend, CDN, domínio ou conta GitHub.

Os tempos de rede reportados em etapas anteriores pertenciam à versão monolítica anterior, não a esta refatoração com recursos externos. Não foram reutilizados como resultado de desempenho desta entrega.

Não existe backend no material auditado; testes de carga, saturação e quotas de API precisam ser feitos no ambiente correspondente, quando existir. A consulta HTTP HEAD descrita no README é uma inspeção de headers, não teste de carga.
