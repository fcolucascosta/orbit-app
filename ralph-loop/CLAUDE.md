# Ralph Loop - Instruções para o Claude

## O Que É Este Arquivo
Este arquivo contém as instruções que o Claude deve seguir durante cada loop de desenvolvimento.

---

## Processo do Loop

### ANTES de Cada Loop
1. Ler `current-task.md` para ver a tarefa atual
2. Ler `backlog.md` para contexto
3. Ler `changelog.md` para ver o que já foi feito

### DURANTE Cada Loop
1. Atualizar `current-task.md` com status "EM PROGRESSO"
2. Implementar APENAS a tarefa especificada
3. Fazer commits pequenos e frequentes
4. Testar manualmente após cada mudança significativa

### APÓS Cada Loop
1. Atualizar `changelog.md` com as mudanças feitas
2. Marcar tarefa como concluída no `backlog.md`
3. Atualizar `current-task.md` com próxima tarefa
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
[LOOP-01] Adiciona funcionalidade de arquivar hábitos

- Novo campo archived na tabela habits
- Botão arquivar no modal de edição
- Filtro para não mostrar arquivados na lista

Refs: B01
```

---

## Comando para Iniciar Loop

Quando o usuário disser "próximo loop" ou "loop X", seguir:

1. Ler os 3 arquivos do ralph-loop/
2. Identificar a tarefa atual
3. Perguntar se pode começar (se não for óbvio)
4. Implementar seguindo o processo acima

---

## Regras de Ouro

1. **Uma tarefa por loop** - Não misturar tarefas
2. **Testar antes de commitar** - Sempre rodar checklist
3. **Mudanças pequenas** - Preferir vários commits pequenos
4. **Documentar tudo** - Atualizar changelog detalhadamente
5. **Não quebrar o que funciona** - Se duvidar, não mexer
6. **Perguntar quando incerto** - Melhor perguntar do que quebrar

---

## Estrutura de Arquivos

```
ralph-loop/
├── CLAUDE.md        # Este arquivo (instruções)
├── backlog.md       # Lista de tarefas pendentes
├── changelog.md     # Histórico de mudanças
└── current-task.md  # Tarefa sendo trabalhada
```

