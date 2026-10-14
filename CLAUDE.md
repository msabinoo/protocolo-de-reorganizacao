# CONTEXTO OBRIGATÓRIO — Protocolo de Reorganização

Você está trabalhando no site pessoal da Natália, desenvolvido pela irmã dela com Claude Code.

## O que é o projeto
Aplicação web em português do Brasil para planejar e executar protocolos pessoais de terapias integrativas/energéticas. A prioridade absoluta é apoiar a execução de tarefas diante das dificuldades associadas ao TDAH: baixa fricção, clareza do próximo passo, ausência de culpa, reforço visual e simplicidade. Não é um aplicativo médico e NÃO deve prometer resultados financeiros, energéticos ou de saúde.

## Sua primeira ação
1. Leia `README_PT-BR.md`, `docs/ESPECIFICACAO_FUNCIONAL.md`, `docs/DESIGN_SYSTEM.md` e `docs/CRITERIOS_DE_ACEITE.md`.
2. Examine `assets/referencia-visual.png` como referência estética, sem usá-la como imagem de fundo da aplicação.
3. Inspecione o código em `src/`, preserve os dados existentes e rode `npm install`/`npm run build`.
4. Faça um plano curto; depois IMPLEMENTE o necessário, sem interromper para perguntas triviais.

## Regras importantes
- Mantenha React + TypeScript + Vite e interface em pt-BR.
- Preserve a paleta e o estilo mágico premium; priorize hierarquia, contraste e acessibilidade.
- O app já inclui versão inicial funcional, porém incompleta. Evolua e teste; não recomece nem apague trabalho sem motivo.
- Sem autenticação, integração externa, backend pago ou envio de dados pessoais a servidores, exceto mediante autorização explícita.
- O histórico é pessoal, inclusive emocional. Dados ficam neste navegador via localStorage. Garanta exportação/importação de backup. Antes de implantar na internet, proponha melhorias de armazenamento e privacidade.
- Nunca apague dados salvos automaticamente ou zere progresso quando muda a data/mês.
- Cada fluxo programado conta uma unidade de progresso SOMENTE após check-out/conclusão; progresso = conclusões ÷ fluxos programados no mês.
- Se a programação mudar, manter registros de sessões concluídas no histórico, mesmo que não façam mais parte do denominador.
- O cronômetro usa relógio real (Date.now) e persiste ao atualizar a página; pausar/retomar devem ser confiáveis; ao finalizar oferece registro posterior.
- Campos emocionais opcionais (redução de fricção). Respostas do pós-fluxo alimentam balões do avatar; evitar exposição pública automática.
- Layout responsivo desktop e celular, boa legibilidade, teclado, `prefers-reduced-motion`.
- Evite promessas terapêuticas milagrosas, pressão para completar tarefas, punições por faltar dias e efeitos visuais distrativos no temporizador.

## Referências
`assets/referencia-visual.png`: conjunto de 5 telas visuais aprovado como DIREÇÃO CONCEITUAL. Contém datas e valores ilustrativos, que não devem ser tratados como dados reais.
`PROMPT_PARA_CLAUDE_CODE.md`: primeiro pedido do desenvolvimento.
