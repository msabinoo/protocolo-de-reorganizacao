Você é o desenvolvedor principal do projeto web "Protocolo de Reorganização". A usuária final é Natália; eu sou a irmã dela, responsável pela implementação. Nossa meta nesta sessão é transformar o projeto inicial desta pasta em um site utilizável, polido e confiável, pronto para a Natália testar no Windows e no celular.

ANTES DE FAZER QUALQUER ALTERAÇÃO:
1. Leia integralmente `CLAUDE.md`, `README_PT-BR.md`, `docs/ESPECIFICACAO_FUNCIONAL.md`, `docs/DESIGN_SYSTEM.md` e `docs/CRITERIOS_DE_ACEITE.md`.
2. Examine visualmente `assets/referencia-visual.png`. É uma referência do conjunto de 5 telas, não um fundo a ser copiado literalmente. Confira `public/` e `src/` para entender o que já funciona.
3. Execute `npm install` e `npm run build` (se dependências estiverem ausentes, instale); inspecione erros reais antes de corrigir.

OBJETIVO:
Construir um site em React + TypeScript + Vite, em português do Brasil, responsivo, com visual mágico de luxo (roxo realeza + dourado) e UX especificamente pensada para ajudar alguém com TDAH a iniciar e concluir protocolos pessoais de terapias integrativas. A funcionalidade de EXECUTAR importa mais que decorar a tela. O projeto já tem uma base funcional: preserve-a e evolua.

TELAS OBRIGATÓRIAS:
A. HOJE: data real; fluxos do dia segundo calendário; botão Iniciar/Retomar; barra proporcional ao mês com bonequinha que caminha; imagem escolhida como meta no final; balões do avatar gerados de respostas reais do pós-fluxo; contadores úteis.
B. PLANEJAMENTO DO MÊS: nome do protocolo, objetivo, alvo financeiro, alvo de saúde, foto, mandala da vida em 8 áreas com notas 0–10 (antes e comparação depois), calendário clicável, seleção de vários fluxos por dia e biblioteca editável de fluxos com duração (60 min como padrão).
C. ANTES DO FLUXO: opções emocionais de um toque, campo livre, intenção e energia; campos textuais opcionais para eliminar fricção.
D. EXECUÇÃO: temporizador regressivo confiável de 1 hora por padrão, com Pausar/Retomar/Encerrar; avançar ao pós-fluxo quando terminar, SEM registrar automaticamente como concluído. Preservar tempo ao recarregar; foco visual e animações discretas.
E. DEPOIS DO FLUXO: emoções rápidas, sensação depois, insights; botão Concluir marca no diário, alimenta balões e aumenta o progresso.
F. DIÁRIO/HISTÓRICO: antes/depois de cada prática, filtro útil, backup exportar/importar.

EXIGÊNCIAS:
- Use as cores exatas documentadas em `docs/DESIGN_SYSTEM.md`. Faça a interface visualmente próxima da referência em `assets/referencia-visual.png`, mas priorize legibilidade e não use a imagem como uma tela falsa.
- Não inventar sessões concluídas nem progresso. Os dados iniciais são demonstração editável, com 0 conclusões.
- O avanço mede tarefas cumpridas, não dinheiro ganho nem evolução clínica. Não faça promessas de resultados externos.
- Não usar punições por dias perdidos; exiba convites gentis para retomar.
- Tratar saída do temporizador, refresh, duplo clique, troca de aba, mudança de mês, dia sem fluxos, importação de backup, textos longos e Safari iOS.
- Mantenha privacidade: nada de login, analytics, serviços externos ou credenciais para a versão local. Não apague dados da usuária nem altere o esquema de armazenamento sem migração segura.
- Funcionar em desktop e celular; foco visível por teclado, contraste, `prefers-reduced-motion`.
- Corrigir qualquer erro de TypeScript, warnings, telas vazias e problemas de layout.
- Criar testes apropriados para a lógica crítica (progresso/calendário/timer/persistência) e rodá-los. Se alguma dependência de teste for adicionada, documente.

FORMA DE TRABALHAR:
1. Resuma rapidamente os arquivos examinados e faça um plano em etapas.
2. Implemente, execute os comandos de verificação e corrija falhas. Não pare em descrição, escreva de fato os arquivos.
3. Ao final, explique claramente o que foi feito, o que foi testado e como iniciar pelo PowerShell (`npm run dev`).
4. Liste limitações que dependam de decisão humana (ex.: sincronizar aparelhos), mas NÃO interrompa o desenvolvimento por detalhes secundários.

Entregue a versão mais completa possível NESTA execução. Comece agora pela leitura dos arquivos e pelo build.
