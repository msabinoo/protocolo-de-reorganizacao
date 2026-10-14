# Protocolo de Reorganização ✧

Projeto inicial do site pessoal de protocolos terapêuticos e organização mensal para Natália, construído pela irmã dela no Claude Code.

**Status:** versão 1 completa e funcional (Hoje, Planejamento, Check-in, Cronômetro, Check-out e Diário). Detalhes dos testes em `docs/STATUS_VERIFICACAO.md`.

## Primeiro uso no Windows
1. Extraia o ZIP para a **Área de Trabalho**, ficando uma pasta chamada `protocolo-de-reorganizacao`.
2. Entre na pasta pelo Explorador de Arquivos, clique na barra de endereço, digite `powershell` e pressione Enter.
3. Verifique se o Node.js está instalado: `node -v`. Se não estiver, instale a versão LTS (preferencialmente 22 ou superior) de https://nodejs.org e reabra o PowerShell.
4. Instale dependências: `npm install`.
5. Para ver a primeira versão: `npm run dev`, então abra o endereço local indicado (normalmente http://127.0.0.1:5173/).
6. Em outra janela do PowerShell, na MESMA pasta, digite `claude` para abrir o Claude Code.
7. Cole todo o texto de `PROMPT_PARA_CLAUDE_CODE.md` no Claude Code (ou peça: "Leia PROMPT_PARA_CLAUDE_CODE.md e execute tudo") e autorize alterações após revisá-las.
8. Depois que o Claude terminar cada etapa, execute `npm run build` e teste no navegador.

## Se o comando `claude` não existir
Instale Claude Code pelo PowerShell:
`irm https://claude.ai/install.ps1 | iex`
Feche e abra o PowerShell novamente; confirme com `claude --version`. O primeiro login no Claude pode pedir autenticação no navegador. Documentação: https://code.claude.com/docs/en/overview

## Estrutura
- `src/`: código React + TypeScript; inicialização e CSS.
- `public/`: ilustração da bonequinha e imagem substituta do objetivo.
- `assets/referencia-visual.png`: mockup das cinco telas.
- `docs/ESPECIFICACAO_FUNCIONAL.md`: comportamentos e fluxo das páginas.
- `docs/DESIGN_SYSTEM.md`: cores, fontes, estilo e acessibilidade.
- `docs/CRITERIOS_DE_ACEITE.md`: checklist para testar antes de concluir.
- `CLAUDE.md`: regras que o Claude Code deve ler automaticamente.
- `PROMPT_PARA_CLAUDE_CODE.md`: solicitação completa para iniciar desenvolvimento.

## Limitação importante
A versão inicial grava os dados no navegador (localStorage). Esse registro NÃO sincroniza entre aparelhos e pode desaparecer quando a pessoa limpar dados do navegador. O botão **Exportar backup** na página Diário permite salvar uma cópia JSON; guarde-a em local seguro, porque também contém registros emocionais.

## Comandos úteis
- `npm install`: instalar bibliotecas.
- `npm run dev`: abrir o servidor local.
- `npm run build`: checar TypeScript e gerar a versão final otimizada.
- `npm run test:logic`: rodar os 20 testes de lógica (progresso, calendário, cronômetro, balões, backup). Requer Node.js 22+.
- `npm run preview`: revisar a versão gerada.
- `Ctrl+C`: parar o servidor no PowerShell.

Não é necessário comprar serviço, registrar domínio ou configurar banco de dados para testar localmente.

## Estrutura do código
- `src/domain.ts`: regras puras (progresso, cronômetro, programação, balões, migração de dados).
- `src/storage.ts`: leitura/gravação no localStorage com cópia de segurança se algo estiver ilegível.
- `src/pages/`: Hoje, Planejamento, telas do ritual (antes, cronômetro, depois) e Diário.
- `src/components/`: bonequinha (SVG animado), mandala interativa, barra da jornada, ícones, efeitos (partículas, brilhos, sino) e diálogos.

## Preferências
O botão de ajustes no topo permite escolher animações automáticas, completas ou reduzidas e ligar/desligar o sino suave do fim do tempo.
