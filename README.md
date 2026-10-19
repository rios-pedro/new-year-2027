# Convite de Réveillon

SPA React + TypeScript para confirmação de presença e organização colaborativa da festa, usando Supabase diretamente no navegador.

O projeto pode ser publicado diretamente na Vercel como um projeto Vite.

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

O link de cada convidado deve usar o formato:

```text
/?guest_id=UUID_DO_CONVIDADO
```

Para que o formulário use `upsert` por convidado, `contributions.guest_id` precisa ter uma restrição `UNIQUE` (além da FK para `guests.id`). O realtime também precisa estar habilitado para a tabela `contributions` no Supabase.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Deploy na Vercel

Importe o repositório `rios-pedro/new-year-2027` na Vercel e configure as variáveis de ambiente do projeto:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

O comando de build é `npm run build` e o diretório de saída é `dist`.
