# Tarefa Atual

## Status: IMPLEMENTADO - AGUARDANDO TESTE

---

## Próxima Tarefa Sugerida

**ID:** B01
**Título:** Arquivar hábitos
**Prioridade:** Alta
**Tipo:** Básica

### Descrição
Adicionar funcionalidade para arquivar hábitos em vez de deletá-los permanentemente. Hábitos arquivados não aparecem na view principal mas podem ser visualizados e desarquivados.

### Critérios de Aceite
- [ ] Campo `archived` (boolean) na tabela `habits`
- [ ] Campo `archived_at` (timestamp) na tabela `habits`
- [ ] Botão "Arquivar" no modal de edição
- [ ] Hábitos arquivados não aparecem na lista principal
- [ ] Manter dados de completions ao arquivar
- [ ] **CRÍTICO:** Não quebrar marcação de hábitos

### Arquivos que Serão Modificados
- `scripts/003_add_archive_columns.sql` (novo)
- `app/page.tsx` - adicionar filtro e botão de arquivar

### Arquivos que NÃO Devem Ser Modificados
- Funções: `toggleHabit`, `isHabitCompleted`, `getStreakColor`, `formatDateKey`

### Estimativa de Risco
- **Baixo** - Mudança aditiva, não modifica lógica existente

---

## Histórico de Tarefas

| Loop | ID | Tarefa | Status |
|------|-----|--------|--------|
| - | - | Aguardando início | - |

---

## Notas do Desenvolvedor

*Espaço para anotações durante o desenvolvimento*

