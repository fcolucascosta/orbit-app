# Ralph Loop - Sistema de Desenvolvimento

## Como Usar

1. Execute `loop.bat` para iniciar um loop
2. Leia este arquivo para ver a tarefa atual
3. Implemente a tarefa seguindo as instruções
4. Atualize `RALPH-CHANGELOG.md` com as mudanças
5. Execute `loop.bat` novamente para próximo loop
6. Para resetar contador: `loop.bat reset`

---

## Tarefa Atual

**Status:** CONCLUÍDO

**ID:** B08
**Título:** Ordenar por nome/cor/data
**Prioridade:** Alta
**Tipo:** Básica

### Descrição
Adicionar opções de ordenação dos hábitos além do drag-and-drop manual. Permitir ordenar por nome (alfabético), cor, ou data de criação.

### Critérios de Aceite
- [ ] Dropdown/botão de ordenação na sidebar
- [ ] Opção: Ordenar por nome (A-Z)
- [ ] Opção: Ordenar por cor
- [ ] Opção: Ordenar por data de criação
- [ ] Opção: Manual (ordem atual via drag-and-drop)
- [ ] Ordenação persiste no banco (atualiza position)
- [ ] **CRÍTICO:** Não quebrar marcação de hábitos

### Arquivos a Modificar
- `app/page.tsx` - Adicionar controles de ordenação

### Arquivos que NÃO Devem Ser Modificados
- Funções: `toggleHabit`, `isHabitCompleted`, `getStreakColor`, `formatDateKey`

### Estimativa de Risco
- **Baixo** - Modifica apenas ordem de exibição, não lógica core

---

## Processo do Loop (Instruções para o Claude)

### ANTES de Cada Loop
1. Ler este arquivo para ver a tarefa atual
2. Ler `RALPH-BACKLOG.md` para contexto
3. Ler `RALPH-CHANGELOG.md` para ver o que já foi feito

### DURANTE Cada Loop
1. Atualizar este arquivo com status "EM PROGRESSO"
2. Implementar APENAS a tarefa especificada
3. Fazer commits pequenos e frequentes
4. Testar manualmente após cada mudança significativa

### APÓS Cada Loop
1. Atualizar `RALPH-CHANGELOG.md` com as mudanças feitas
2. Marcar tarefa como concluída no `RALPH-BACKLOG.md`
3. Atualizar este arquivo com próxima tarefa
4. Rodar checklist de segurança

---

## Checklist de Segurança (OBRIGATÓRIO)

Após QUALQUER mudança em `app/page.tsx`, verificar:

```
[ ] Clicar em quadradinho marca o hábito (fica colorido)
[ ] Clicar novamente desmarca (fica transparente)
[ ] Cores escurecem conforme streak aumenta
[ ] Atualizar página mantém marcações
[ ] Break habits clareiam em vez de escurecer
[ ] Weekly habits mostram dots de progresso
[ ] Criar novo hábito funciona
[ ] Editar hábito funciona
[ ] Deletar hábito funciona
```

---

## Funções PROIBIDAS de Modificar

**NUNCA alterar estas funções sem aprovação explícita:**

1. `toggleHabit()` - Linhas ~192-220
2. `isHabitCompleted()` - Linha ~224
3. `getStreakColor()` - Linhas ~226-295
4. `formatDateKey()` - Linhas ~49-54

Se precisar modificar, criar CÓPIA primeiro e testar extensivamente.

---

## Formato de Commit

```
[LOOP-XX] Descrição curta

- Detalhe 1
- Detalhe 2

Refs: BXX ou AXX (ID do backlog)
```

Exemplo:
```
[LOOP-07] Adiciona toast notifications

- Integra biblioteca sonner
- Toast de sucesso em criar/editar/deletar
- Toast de erro em falhas de rede

Refs: B07
```

---

## Regras de Ouro

1. **Uma tarefa por loop** - Não misturar tarefas
2. **Testar antes de commitar** - Sempre rodar checklist
3. **Mudanças pequenas** - Preferir vários commits pequenos
4. **Documentar tudo** - Atualizar changelog detalhadamente
5. **Não quebrar o que funciona** - Se duvidar, não mexer
6. **Perguntar quando incerto** - Melhor perguntar do que quebrar

---

## Histórico de Loops

| Loop | ID | Tarefa | Data | Status |
|------|-----|--------|------|--------|
| 01 | B01 | Arquivar hábitos | 2026-01-29 | ✅ Concluído |
| 02 | B03 | Feedback visual | 2026-01-29 | ✅ Concluído |
| 03 | B04 | Tratamento de erros | 2026-01-29 | ✅ Concluído |
| 04 | B05 | Loading skeleton | 2026-01-29 | ✅ Concluído |
| 05 | B06 | Confirmação ao deletar | 2026-01-29 | ✅ Concluído |
| 06 | B07 | Toast notifications | 2026-01-30 | ✅ Concluído |
| 07 | - | - | - | ⏸️ Aguardando |

---

## Comandos Rápidos

```bash
# Iniciar próximo loop
loop.bat

# Resetar contador
loop.bat reset

# Ver status atual
type RALPH-LOOP.md

# Ver histórico de mudanças
type RALPH-CHANGELOG.md

# Ver backlog completo
type RALPH-BACKLOG.md
```
