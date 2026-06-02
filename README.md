# Eywa

Aplicativo de produtividade pessoal com tarefas, calendário e modo foco. Feito com React + Supabase.

## Funcionalidades

- Tarefas com data, duração e lembretes
- Tarefas prioritárias (MIT) e recorrência diária
- Drag-and-drop para reordenar
- Modo foco com cronômetro
- Calendário de eventos
- Temas escuro, claro e automático
- PWA instalável

## Rodando localmente

1. Instale as dependências: `npm install`
2. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Execute as migrations em `supabase/` no SQL Editor do Supabase
4. `npm run dev`
