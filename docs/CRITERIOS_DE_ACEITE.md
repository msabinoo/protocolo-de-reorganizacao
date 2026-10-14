# Testes e critérios de aceite

O projeto só está pronto para entrega quando:

- [ ] `npm install`, `npm run dev` e `npm run build` funcionam sem erros.
- [ ] Abrir o site mostra os fluxos PROGRAMADOS PARA A DATA REAL do computador.
- [ ] Planejamento permite editar metas, foto, mandala e calendário do mês.
- [ ] Um dia pode ter fluxos 1, 3 e 5 e cada um é concluído separadamente.
- [ ] Antes de executar há check-in emocional rápido; textos podem ficar vazios.
- [ ] O timer mostra 60:00 inicialmente (ou duração configurada), pausa/retoma/encerra.
- [ ] Quando o contador chega a zero, aparece o check-out sem concluir automaticamente.
- [ ] Fechar/reabrir ou atualizar a aba durante timer não reseta o tempo (respeita pausa).
- [ ] Confirmar check-out salva sentimentos antes/depois, hora e fluxo no histórico.
- [ ] Concluir faz avançar a barra e a bonequinha; não marcar antes de finalizar.
- [ ] Balões na boneca utilizam textos reais do pós-fluxo, não falas inventadas.
- [ ] Foto escolhida pela usuária aparece no destino da barra e no planejamento.
- [ ] Mandala antes tem oito áreas de 0 a 10; idealmente comparar com depois.
- [ ] Não existem erros de console, datas erradas, fluxo duplicado acidental ou dados perdidos em navegação simples.
- [ ] Backup exportado e importado restaura histórico e planejamento.
- [ ] Interface agradável desktop e celular, e teclado funcional.
- [ ] Nada piscando ou competindo com o cronômetro; movimento reduzido respeitado.
- [ ] Não utilizar frases de culpa nem afirmar que rituais garantem resultados externos.
- [ ] Não pedir conta, API key, Firebase ou serviços pagos para a primeira versão.

## Teste manual importante
1. Faça um backup e mantenha uma cópia.
2. No Planejamento, escolha a data de hoje e agende 3 fluxos.
3. Em um fluxo de TESTE reduza a duração para 1 minuto para verificar a transição do timer.
4. Abra o fluxo, registre o antes, comece, pause/retome e atualize a página.
5. Verifique a transição para o depois, finalize e veja aumento no percentual, avatar e diário.
6. Restaure a duração para 60 minutos e faça outro backup.
