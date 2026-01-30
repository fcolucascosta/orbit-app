# Changelog - Orbit Habit Tracker

Registro de todas as mudanças feitas durante os Ralph Loops.

---

## Loop 01 - 2026-01-29

**Tarefa:** B01 - Arquivar hábitos

**Arquivos Criados:**
- `scripts/003_add_archive_columns.sql` - Migration para adicionar colunas archived e archived_at

**Arquivos Modificados:**
- `app/page.tsx` - Funcionalidade completa de arquivamento

**Mudanças:**
- Adicionado campos `archived` e `archived_at` ao tipo Habit
- Importado ícones Archive e ArchiveRestore do Lucide
- Adicionado estado `showArchived` para toggle entre ativos/arquivados
- Criada função `archiveHabit()` para arquivar um hábito
- Criada função `unarchiveHabit()` para restaurar um hábito
- Filtro `displayedHabits` para separar ativos de arquivados
- Botão toggle "Show Archived" / "Show Active" na sidebar
- Botão "Archive" no modal de edição (cor laranja)
- Botão "Restore" para hábitos arquivados (cor verde)
- Escondido botão "New Habit" quando visualizando arquivados
- Empty state para quando não há hábitos arquivados

**Funções NÃO modificadas (segurança):**
- `toggleHabit()` - Intacta
- `isHabitCompleted()` - Intacta
- `getStreakColor()` - Intacta
- `formatDateKey()` - Intacta

**Testes Necessários:**
- [ ] Marcação de hábitos funciona
- [ ] Cores dos streaks funcionam
- [ ] Criação de hábitos funciona
- [ ] Edição de hábitos funciona
- [ ] Deleção de hábitos funciona
- [ ] Arquivar hábito funciona
- [ ] Restaurar hábito funciona
- [ ] Toggle entre ativos/arquivados funciona

**IMPORTANTE:** Executar migration SQL no Supabase antes de testar!

---

## Loop 02 - 2026-01-29

**Tarefa:** B03 - Feedback visual ao clicar

**Arquivos Modificados:**
- `app/page.tsx` - Estado e lógica de animação
- `app/globals.css` - Keyframes da animação

**Mudanças:**
- Adicionado estado `clickedCell` para rastrear célula clicada
- Animação de "squeeze" (scale 0.92) ao clicar no quadradinho
- Flash branco (opacity 30%) durante o clique
- Animação dura 200ms para feedback rápido
- Reset automático do estado após 300ms

**Funções NÃO modificadas (segurança):**
- `toggleHabit()` - Intacta (apenas chamada dentro do onClick)
- `isHabitCompleted()` - Intacta
- `getStreakColor()` - Intacta
- `formatDateKey()` - Intacta

**Testes Necessários:**
- [ ] Marcação de hábitos funciona
- [ ] Animação aparece ao clicar
- [ ] Cores dos streaks funcionam
- [ ] Performance ok (sem lag)

---

## Loop 03 - 2026-01-29

**Tarefa:** B04 - Tratamento de erros no toggle

**Arquivos Modificados:**
- `app/page.tsx` - Reescrita da função toggleHabit com optimistic update

**Mudanças:**
- Implementado padrão de Optimistic Update:
  - UI atualiza IMEDIATAMENTE ao clicar (sem esperar o banco)
  - Se banco falhar, faz ROLLBACK para estado anterior
  - Se banco suceder, substitui ID temporário pelo ID real
- Ao marcar: cria completion temporária, depois substitui pelo dado real
- Ao desmarcar: remove da UI, restaura se falhar
- Logs de erro no console para debugging

**Comportamento:**
- Usuário clica → UI muda instantaneamente
- Banco responde → Se erro, UI volta ao estado anterior
- Experiência muito mais responsiva

**Funções modificadas:**
- `toggleHabit()` - Reescrita com optimistic update pattern

**Funções NÃO modificadas (segurança):**
- `isHabitCompleted()` - Intacta
- `getStreakColor()` - Intacta
- `formatDateKey()` - Intacta

**Testes Necessários:**
- [ ] Marcação de hábitos funciona (resposta imediata)
- [ ] Cores dos streaks funcionam
- [ ] Reload mantém dados corretos
- [ ] Console mostra erro se banco falhar (testar offline)

---

## Loop 04 - 2026-01-29

**Tarefa:** B05 - Loading skeleton

**Arquivos Modificados:**
- `app/page.tsx` - Substituído spinner por skeleton

**Mudanças:**
- Removido spinner de loading genérico
- Adicionado skeleton que espelha estrutura real do app:
  - Header skeleton com logo e botões
  - Sidebar skeleton com 5 linhas de hábitos
  - Grid skeleton com header de datas e células
- Usa animate-pulse do Tailwind para efeito de loading
- Mantém layout idêntico ao app carregado (sem "pulo" visual)

**Benefícios:**
- Usuário vê a estrutura do app imediatamente
- Transição suave quando dados carregam
- Percepção de velocidade melhorada

**Funções NÃO modificadas (segurança):**
- `toggleHabit()` - Intacta
- `isHabitCompleted()` - Intacta
- `getStreakColor()` - Intacta
- `formatDateKey()` - Intacta

**Testes Necessários:**
- [ ] Skeleton aparece ao carregar página
- [ ] Transição para dados reais é suave
- [ ] Marcação de hábitos continua funcionando

---

## Loop 05 - 2026-01-29

**Tarefa:** B06 - Confirmação ao deletar

**Arquivos Modificados:**
- `app/page.tsx` - Estado de confirmação e modal

**Mudanças:**
- Adicionado estado `confirmingDelete` para controlar modal
- Botão "Delete" no modal de edição agora abre confirmação
- Novo modal de confirmação com:
  - Ícone de X vermelho
  - Texto explicando que a ação é permanente
  - Botões Cancel e Delete
- Modal com z-index maior (60) para ficar sobre o modal de edição
- Deleção só ocorre após confirmar

**Funções NÃO modificadas (segurança):**
- `toggleHabit()` - Intacta
- `isHabitCompleted()` - Intacta
- `getStreakColor()` - Intacta
- `formatDateKey()` - Intacta

**Testes Necessários:**
- [ ] Clicar Delete abre modal de confirmação
- [ ] Cancel fecha o modal sem deletar
- [ ] Confirmar Delete exclui o hábito
- [ ] Marcação de hábitos continua funcionando

---

## Formato do Registro

### Loop XX - [DATA]

**Tarefa:** ID e descrição da tarefa do backlog

**Arquivos Modificados:**
- `path/to/file.tsx` - descrição da mudança

**Mudanças:**
- Descrição detalhada do que foi feito

**Testes Realizados:**
- [ ] Marcação de hábitos funciona
- [ ] Cores dos streaks funcionam
- [ ] Criação de hábitos funciona
- [ ] Edição de hábitos funciona
- [ ] Deleção de hábitos funciona

**Notas:**
- Observações importantes

---

## Checklist de Segurança (Usar em Todo Loop)

Antes de considerar um loop completo, verificar:

1. [ ] **Marcação funciona** - Clicar no quadradinho marca/desmarca corretamente
2. [ ] **Cores aparecem** - Quadradinhos marcados ficam coloridos
3. [ ] **Streak funciona** - Cores escurecem conforme o streak aumenta
4. [ ] **Persiste no banco** - Atualizar página mantém as marcações
5. [ ] **Break habits** - Hábitos "quebrar" têm cores inversas (clareiam)
6. [ ] **Weekly habits** - Hábitos semanais mostram progresso correto
7. [ ] **Não quebrou auth** - Login/logout funcionam
8. [ ] **Mobile funciona** - Testar em viewport pequeno

