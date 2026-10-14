# Status de verificação — 14/10/2026

## Comandos executados (Node.js 24.22 LTS, Windows 11)
- `npm install`: ok (70 pacotes).
- `npm run build` (`tsc -b && vite build`): ok, sem erros nem avisos de TypeScript.
- `npm run test:logic`: **20 de 20 testes passaram** (datas/calendário, progresso, programação, exclusão de fluxo, cronômetro, balões, migração v1→v2, backup ida e volta, recusa de arquivos inválidos).

## Teste no navegador (Microsoft Edge headless, desktop 1440px e celular 390px)
Roteiros automatizados com cliques reais, todos aprovados e sem erros no console:
- Página Hoje mostra os fluxos programados para a data real; dia sem programação mostra estado vazio acolhedor.
- Check-in → cronômetro começa em 60:00, avança pelo relógio real; pausar congela; recarregar a página preserva o tempo e a tela.
- Navegar para outra tela mantém o cronômetro (pílula flutuante para voltar).
- "Concluir" antes do tempo pede confirmação; fim do tempo (fluxo de 1 min) leva ao check-out **sem concluir sozinho**.
- "Registrar depois" mantém o fluxo pendente com indicação clara do próximo passo.
- Concluir o ritual atualiza percentual, bonequinha, card, balão (com a frase real) e diário; persiste após recarregar.
- Retirar um fluxo concluído da programação recalcula o percentual e mantém o histórico.
- Criar fluxo na biblioteca, programá-lo para hoje e vê-lo na página inicial.
- Clique na mandala define a nota da área; troca de mês alinha o calendário ao dia da semana.
- Exportar backup → apagar dados → importar restaura histórico e biblioteca.

## Pendente de verificação humana
- Teste em iPhone/Safari e Android reais.
- Leitura com leitor de tela (NVDA/VoiceOver).
