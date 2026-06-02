# Eywa

Aplicativo de produtividade pessoal com gerenciamento de tarefas, calendário e modo foco.

## Funcionalidades

- **Tarefas** — criação, edição, exclusão e conclusão de tarefas
- **Prioridades (MIT)** — marque tarefas como Most Important Tasks; ficam fixadas no topo
- **Tarefas diárias** — tarefas recorrentes que reiniciam todos os dias
- **Drag-and-drop** — reordene tarefas arrastando
- **Modo foco** — sessão cronometrada dedicada a uma única tarefa
- **Calendário** — agenda de eventos com visão semanal
- **Lembretes** — notificações push com antecedência configurável
- **Temas** — escuro, claro e automático (sistema)
- **PWA** — instalável como app, funciona com service worker

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, Vite 8 |
| Roteamento | React Router v7 |
| Backend / Auth | Supabase (PostgreSQL + Auth) |
| Drag-and-drop | @dnd-kit |
| Ícones | lucide-react |
| Deploy | Netlify |

## Configuração local

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Passos

1. Clone o repositório e instale as dependências:

```bash
git clone <url-do-repo>
cd eywa
npm install
```

2. Crie um projeto no Supabase e execute as migrations em ordem na aba **SQL Editor**:

```
supabase/migration_profiles.sql
supabase/migration_tasks.sql
supabase/migration_events.sql
supabase/migration_reminder.sql
```

3. Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Deploy

O projeto está configurado para deploy no Netlify via `netlify.toml`. Basta conectar o repositório e definir as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações do site.

## Estrutura do banco de dados

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (username) |
| `tasks` | Tarefas com suporte a datas, duração, lembretes e recorrência diária |
| `events` | Eventos do calendário |

## Licença

MIT
