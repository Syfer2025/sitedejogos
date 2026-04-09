# Sistema de Gamificação

Este documento descreve o sistema de gamificação do Gasty Games com foco em retenção, recorrência de uso e aumento de profundidade de sessão.

## Estado atual implementado
- XP por ações-chave: cadastro, login diário, favoritar jogo, jogar com conta e atualizar perfil.
- Níveis simples baseados em faixas de XP.
- Streak de atividade por dias consecutivos.
- Conquistas persistidas em banco.
- Notificações internas para level up, streak e conquistas.
- Painel inicial de progresso dentro da conta do jogador.

## Objetivos de produto
- Aumentar retorno semanal e recorrência diária.
- Dar feedback imediato para ações úteis ao negócio.
- Incentivar exploração do catálogo, não só repetição do mesmo jogo.
- Criar trilhas curtas de progressão visíveis sem depender de recompensas financeiras.

## Loop principal de retenção
1. Jogador entra, joga ou favorita um título.
2. O sistema concede XP, atualiza streak e pode desbloquear conquista.
3. A conta mostra progresso para o próximo nível e novas notificações.
4. O jogador recebe um motivo claro para voltar: manter streak, completar conquista ou avançar de nível.

## Mecânicas recomendadas
### Camada base
- XP por evento com pesos pequenos e previsíveis.
- Leveling simples com progressão transparente.
- Conquistas de onboarding, exploração, coleção e consistência.
- Notificações internas contextualizadas.

### Camada média
- Missões diárias como jogar 2 jogos novos, salvar 1 favorito ou concluir 3 sessões.
- Missões semanais por categoria, por exemplo jogar 5 títulos de Racing.
- Recompensas cosméticas de perfil, molduras, títulos ou badges especiais.
- Coleções salvas, como “Top corrida”, “Puzzle rápido”, “Jogos para depois”.

### Camada avançada
- Ligas sazonais por XP ganho na semana.
- Eventos temáticos por categoria ou campanha editorial.
- Recompensas temporárias por sequência longa ou exploração inédita.
- Recomendações guiadas por missões ativas e conquistas quase concluídas.

## Trilhas de conquista sugeridas
### Onboarding
- Criar conta.
- Completar perfil.
- Jogar primeiro título.

### Exploração
- Jogar 5 jogos diferentes.
- Jogar 3 categorias diferentes.
- Jogar um lançamento da semana.

### Coleção
- Favoritar 1, 5 e 15 jogos.
- Criar primeira coleção salva.

### Consistência
- Streak de 3, 7, 14 e 30 dias.
- 10, 25 e 50 sessões registradas.

## Missões diárias recomendadas
- Jogar 2 títulos diferentes.
- Favoritar 1 jogo novo.
- Voltar e completar uma sessão em categoria recomendada.
- Ler 1 artigo do blog e abrir um jogo relacionado.

## Integração com o produto atual
- Home personalizada pode priorizar jogos que ajudem a fechar missão diária.
- Analytics internos já existentes podem medir impacto de streak, nível e conquistas.
- Blog pode disparar campanhas editoriais convertidas em missões ou eventos temáticos.
- Admin analytics pode ganhar widgets de retenção depois: DAU, WAU, streak média e XP gerado por dia.

## Métricas para acompanhar
- DAU, WAU e razão DAU/WAU.
- Retenção D1, D7 e D30.
- Sessões por usuário autenticado.
- Jogos distintos por usuário por semana.
- Favoritos criados por usuário ativo.
- Percentual de jogadores com streak maior que 1, 3 e 7 dias.
- Distribuição de XP e níveis.
- Taxa de conclusão de missões e conquistas.

## Regras anti-abuso
- XP relevante deve depender de ação significativa e não só refresh de página.
- Missões e streak precisam respeitar limites por dia-calendário.
- Favoritos duplicados não devem gerar XP repetido.
- Eventos de sessão devem ser deduplicados por sessão quando possível.

## Próximas fases sugeridas
### Fase 1
- Adicionar missões diárias persistidas.
- Exibir CTA de “voltar amanhã” e “falta pouco para o próximo nível”.
- Medir retenção antes e depois.

### Fase 2
- Implementar coleções salvas.
- Criar badges cosméticas e títulos de perfil.
- Enriquecer o painel da conta com histórico de progressão.

### Fase 3
- Ligas sazonais.
- Eventos temáticos integrados ao calendário editorial.
- Segmentação de campanhas por perfil de jogador.