# Backlog - Orbit Habit Tracker

## Regras Importantes
- **NUNCA modificar** a lógica de `toggleHabit()`, `isHabitCompleted()` ou `getStreakColor()` sem testes extensivos
- **NUNCA modificar** o formato de `formatDateKey()` (YYYY-MM-DD)
- **SEMPRE testar** marcação de hábitos após qualquer mudança no `page.tsx`
- Manter simplicidade - sem gamificação

---

## Melhorias Pendentes (Ordenadas por Prioridade)

### BÁSICAS - Alta Prioridade

- [x] **B01** - Arquivar hábitos: Adicionar campo `archived` na tabela habits e filtrar da view principal
- [x] **B02** - Ver hábitos arquivados: Botão/seção para visualizar e desarquivar hábitos
- [x] **B03** - Feedback visual ao clicar: Animação sutil ao marcar/desmarcar hábito (pulse ou scale)
- [x] **B04** - Tratamento de erros no toggle: Rollback do estado se o banco falhar
- [x] **B05** - Loading skeleton: Mostrar skeleton enquanto carrega dados iniciais
- [x] **B06** - Confirmação ao deletar: Modal de confirmação antes de excluir hábito permanentemente
- [x] **B07** - Toast notifications: Feedback visual para ações (criado, editado, deletado, erro)
- [ ] **B08** - Ordenar por nome/cor/data: Opções de ordenação além do drag-and-drop

### BÁSICAS - Média Prioridade

- [ ] **B09** - Notas diárias: Campo opcional para adicionar nota em uma marcação específica

- [ ] **B12** - Melhorar responsividade: Ajustar layout para tablets (7 dias visíveis)
- [ ] **B13** - PWA básico: manifest.json e service worker para instalar como app

### AVANÇADAS - Alta Prioridade

- [ ] **A01** - Lembretes/Notificações: Integrar com API de notificações do browser
- [ ] **A02** - Exportar dados: Botão para exportar todos os dados em JSON/CSV
- [ ] **A03** - Estatísticas globais: Dashboard com visão geral de todos os hábitos
- [ ] **A04** - Modo offline: Salvar ações localmente e sincronizar quando online
- [ ] **A05** - Metas de streak: Definir meta de dias consecutivos e mostrar progresso

### AVANÇADAS - Média Prioridade

- [ ] **A06** - Categorias/Tags: Agrupar hábitos por categoria (saúde, trabalho, etc.)
- [ ] **A07** - Múltiplas visualizações: Alternar entre grid diário, semanal e mensal
- [ ] **A08** - Histórico de edições: Log de quando hábito foi criado/modificado
- [ ] **A10** - Pausar hábito: Suspender temporariamente sem afetar streaks (férias, doença)

### AVANÇADAS - Baixa Prioridade

- [ ] **A11** - Compartilhar progresso: Gerar imagem do progresso para compartilhar

### POLIMENTO E UX

- [ ] **P01** - Microinterações: Animações sutis em hover, transições mais suaves
- [ ] **P02** - Empty states: Telas bonitas quando não há dados
- [ ] **P04** - Acessibilidade: Melhorar ARIA labels, contraste, navegação por teclado
- [ ] **P05** - Performance: Memoização do cálculo de cores, lazy loading

---

## Inspiração de Concorrentes

### Streaks (iOS)
- UI minimalista com círculos
- Lembretes personalizáveis
- Widget de tela inicial

### Habitify
- Múltiplas visualizações (dia/semana/mês)
- Estatísticas detalhadas
- Modo escuro elegante

### Habit (Loop Habit Tracker - Android)
- Gráficos de tendência
- Backup automático
- Totalmente offline

### Daylio
- Notas junto com marcações
- Moods/sentimentos (não vamos usar, é gamificação)
- Exportação de dados

---

## Ordem sugerida de implementação
1. B01-B06 (Arquivar, feedback, erro handling) ✅ Concluído
2. B07 (Toast notifications) ⏭️ Próximo
3. B08 (Ordenação) - Polish
4. A02 (Exportar) - Segurança dos dados do usuário
5. A01 (Notificações) - Retenção
