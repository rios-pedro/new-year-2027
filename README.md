# Convite de Réveillon

SPA React + TypeScript para confirmação de presença e organização colaborativa da festa, usando Supabase diretamente no navegador.

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
