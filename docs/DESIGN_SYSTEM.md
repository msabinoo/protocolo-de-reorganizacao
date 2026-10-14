# Direção visual — Protocolo de Reorganização

## Conceito
Luxo místico editorial: realeza roxa, ouro, champagne, pequenos símbolos cósmicos, feminilidade e prosperidade. É um espaço mágico para execução diária, NÃO uma interface com efeitos visuais excessivos. A experiência é suficientemente calma para apoiar o foco.

## Cores aprovadas
| Papel | Hex |
|---|---|
| Roxo profundo principal | `#4B1E6D` |
| Roxo de realce | `#6F3FAE` |
| Lavanda auxiliar | `#C8B4E6` |
| Dourado principal | `#D4AF37` |
| Dourado claro/champagne | `#F3E3A1` |
| Fundo principal | `#140B1F` |
| Cards | `#221233` |
| Texto claro | `#F7F1FF` |

## Tipografia
Padrão inicial: Cormorant Garamond para títulos; Inter para textos, botões, números e campos. Fallback local Georgia + Arial; fontes remotas NÃO podem impedir o site de renderizar.

## UI
- Navegação superior: Hoje, Planejamento, Diário.
- Na página inicial, os fluxos do dia vêm ANTES do progresso e têm CTA bem visível.
- Cards com borda dourada discreta, sombras roxas e cantos arredondados.
- CTA principal dourado com texto escuro e alto contraste; no máximo um CTA dominante por contexto.
- Tela de foco quase sem animações; brilho estático discreto.
- Efeitos após completar: pequeno deslocamento da bonequinha, brilho dourado curto, frase de incentivo sem cobrança. Reduzir se `prefers-reduced-motion`.
- Avatar da usuária: personagem feminina desenhada; pode personalizar no futuro.
- Imagem de objetivo: escolhida pela usuária, não gerada automaticamente.
- Balões do avatar: extraídos do registro de pós-fluxo; limitar comprimento e quantidade.
- Texto sempre legível; não colocar textos sobre brilhos intensos.
- Na versão inicial, `public/avatar.svg` e `public/goal-placeholder.svg` são ilustrações originais de apoio.

## Referência visual
`assets/referencia-visual.png` mostra 5 telas: Hoje, Planejamento, Antes, Cronômetro e Depois. Use como referência de composição e linguagem visual, NÃO como screenshot literal ou imagem fixa no site. Datas da imagem são fictícias. A cor oficial é a desta especificação.
