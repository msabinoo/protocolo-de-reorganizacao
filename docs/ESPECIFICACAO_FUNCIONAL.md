# Especificação funcional

## Visão
Site de uso pessoal da Natália para planejar e cumprir protocolos mensais de práticas terapêuticas integrativas e energéticas. Prioridade: ajuda prática na execução e redução da sobrecarga associada ao TDAH. A irmã programará a versão final via Claude Code.

## Navegação principal / estados
1. **Hoje**: data local automaticamente atualizada; fluxos programados para o dia; status individual; CTA Iniciar/Retomar; barra de progresso; bonequinha percorrendo a barra; foto do objetivo no final; balões com sentimentos do pós-sessão; contadores.
2. **Planejamento do mês**: título, objetivo do mês, alvo financeiro, alvo de saúde, foto enviada pela usuária, mandala da vida ANTES (0–10, oito áreas), opcionalmente mandala DEPOIS, calendário do mês, programação de combinações de fluxos em qualquer dia e biblioteca editável de fluxos com duração em minutos.
3. **Antes do fluxo**: ao iniciar sessão, check-in com estados emocionais de seleção rápida, energia 1–5, intenção e campo de desabafo. Evitar obrigatoriedade dos textos para não bloquear o começo. Botão Começar.
4. **Em execução**: temporizador regressivo de 60 minutos por padrão, editável por fluxo; pausar; retomar; encerrar antecipadamente com confirmação; um foco por vez; mínimo estímulo. Ao chegar a zero, direcionar ao pós-fluxo quando a aba estiver ativa, ou ao voltar à aba.
5. **Depois do fluxo**: check-out emocional com seleção rápida e texto livre sobre mudanças, percepções, gratidão. Concluir registra a sessão, atualiza barra e balões.
6. **Diário**: histórico de registros por data/fluxo, com dados antes/depois e exportação/importação de backup JSON.

## Regras do calendário
- Deve ser possível trocar de mês, criar mês novo e editar fluxos do dia.
- Uma mesma data aceita múltiplos fluxos; cada tipo de fluxo pode ocorrer no máximo uma vez no mesmo dia nesta versão (futuro: suporte a repetição configurável).
- Sem fluxos em determinado dia significa dia livre/integração, sem punição.
- Não presumir que toda quarta tenha sempre os mesmos fluxos; o calendário do mês é a fonte de verdade.
- Todos os dados ilustrativos iniciais são EXEMPLOS editáveis; nunca interpretar como conclusões reais.

## Regra de progresso
- Total mensal = soma dos fluxos programados em todos os dias do mês.
- Realizados = sessões concluídas (com check-out final) que ainda constam no calendário do mês.
- Percentual mensal = realizados / total, arredondado, limitado a 100%. Se não houver programação, mostrar 0%, acompanhado de orientações para programar.
- Bonequinha = posição proporcional ao percentual. Foto do objetivo = destino visual; NÃO significa que a meta financeira ou de saúde foi alcançada. Nunca confundir prática concluída com resultado externo obtido.
- A programação alterada recalcula a porcentagem, sem apagar registros históricos.
- Registros do pós-fluxo alimentam balões. Mostrar trechos curtos e preservar texto completo no diário.

## TDAH: prioridades funcionais
- Mostrar "o que faço AGORA?" imediatamente ao abrir.
- Cards e telas com poucas decisões, só uma ação primária.
- Caminho curto: Hoje > Antes > Timer > Depois > Concluído.
- Campos curtos, seleções rápidas, textos opcionais, lembretes gentis.
- Facilidade de retomada sem mensagens de culpa; status claro.
- Feedback visual curto e positivo após concluir; evitar fogos intermináveis.
- Não pressionar com sequência diária, ranking, punição ou metas impossíveis.
- Animações opcionais e suporte a preferência de movimento reduzido.

## Dados e privacidade
- Primeira fase: site local, sem login nem servidor; dados em localStorage do navegador.
- Sentimentos, objetivos e dados financeiros são particulares. Não enviar automaticamente a terceiros nem para telemetria.
- Disponibilizar exportação/importação simples de todos os dados.
- Ao limpar cache ou trocar dispositivo, registros locais podem sumir: lembrar do backup.
- Se implementarem uso em diferentes aparelhos, discutir backend privado/autenticação antes de introduzir sincronização.

## Responsividade e qualidade
- Desktop Windows primeiro, mas layout utilizável em celular.
- Datas locais reais, calendário alinhado ao dia da semana, horários coerentes com fuso local.
- Cronômetro resistente a recarregamento, troca de aba, pausa/retomada.
- Testes de execução de um dia com 3 fluxos, calendário vazio, alteração de mês, mudança de objetivo e recarregamento.
- Não adicionar integrações externas sem necessidade.

## Limitações da base atual a trabalhar
- Visuais e estrutura iniciais estão disponíveis em `src`. Refine aproximação estética com o mockup sem sobrecarregar.
- Evoluir fluxo de retomada e estado pós-check-out após recarregar, testes automatizados, acessibilidade, compatibilidade iPhone/Safari e gerenciamento robusto de dados.
- Reforçar semântica e salvamento confiável; não substituir registros da usuária por dados de exemplo.
