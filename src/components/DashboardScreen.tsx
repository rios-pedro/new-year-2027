import { useCallback, useEffect, useState } from 'react'
import { Check, ClipboardList, ExternalLink, LoaderCircle, MessageCircle, RefreshCw, Sparkles, Utensils, Users, Gamepad2 } from 'lucide-react'
import invitation from '../config/invitation.json'
import { supabase } from '../lib/supabaseClient'
import type { Contribution, Guest, GuestContribution } from '../types'

export function DashboardScreen({ guest }: { guest: Guest }) {
  const [contribution, setContribution] = useState<Contribution>({ food_and_drinks: '', board_games: '' })
  const [guests, setGuests] = useState<GuestContribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadContributions = useCallback(async () => {
    if (!supabase) {
      setErrorMessage('A conexão com o convite ainda não foi configurada.')
      setIsLoading(false)
      return
    }

    const [ownResult, guestsResult] = await Promise.all([
      supabase.from('contributions').select('food_and_drinks, board_games').eq('guest_id', guest.id).maybeSingle(),
      supabase
        .from('guests')
        .select('id, name')
        .eq('rsvp_status', 'confirmed')
        .order('name'),
    ])

    if (ownResult.error || guestsResult.error) {
      setErrorMessage('Não foi possível carregar a organização da festa.')
      setIsLoading(false)
      return
    }

    const confirmedGuests = (guestsResult.data ?? []) as Pick<Guest, 'id' | 'name'>[]
    const guestIds = confirmedGuests.map((confirmedGuest) => confirmedGuest.id)
    const contributionsResult = guestIds.length
      ? await supabase.from('contributions').select('guest_id, food_and_drinks, board_games').in('guest_id', guestIds)
      : { data: [], error: null }

    if (contributionsResult.error) {
      setErrorMessage('Não foi possível carregar os itens dos convidados.')
      setIsLoading(false)
      return
    }

    const contributionsByGuestId = new Map(
      (contributionsResult.data ?? []).map((item) => [item.guest_id, item]),
    )

    setContribution({
      food_and_drinks: ownResult.data?.food_and_drinks ?? '',
      board_games: ownResult.data?.board_games ?? '',
    })
    setGuests(confirmedGuests.map((confirmedGuest) => ({
      ...confirmedGuest,
      contributions: contributionsByGuestId.get(confirmedGuest.id) ?? null,
    })))
    setIsLoading(false)
  }, [guest.id])

  useEffect(() => {
    void loadContributions()
    const client = supabase
    if (!client) return

    const channel = client
      .channel('contributions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => {
        void loadContributions()
      })
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [loadContributions])

  async function saveContribution(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setErrorMessage('A conexão com o convite ainda não foi configurada.')
      return
    }

    setIsSaving(true)
    setMessage('')
    setErrorMessage('')
    const { error } = await supabase.from('contributions').upsert(
      {
        guest_id: guest.id,
        food_and_drinks: (contribution.food_and_drinks ?? '').trim() || null,
        board_games: (contribution.board_games ?? '').trim() || null,
      },
      { onConflict: 'guest_id' },
    )

    if (error) {
      setErrorMessage('Não foi possível salvar seus itens. Tente novamente.')
    } else {
      setMessage('Seus itens foram salvos! A lista de todos foi atualizada.')
      await loadContributions()
    }
    setIsSaving(false)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80"><Sparkles className="h-4 w-4" /> Réveillon</div>
            <h1 className="mt-3 break-words font-serif text-4xl text-white sm:text-6xl">A festa começa aqui.</h1>
            <p className="mt-3 text-sm text-zinc-400">Bem-vindo, <span className="text-amber-200">{guest.name}</span>. Vamos organizar uma noite inesquecível.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400"><Users className="h-4 w-4 text-amber-300" /> Organização colaborativa</div>
        </header>

        <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-400/15 p-3 text-emerald-300"><MessageCircle className="h-5 w-5" /></div>
            <div>
              <h2 className="font-serif text-2xl text-white">Você está confirmado!</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">Entre no grupo do WhatsApp para acompanhar os detalhes da festa.</p>
            </div>
          </div>
          <a
            href={invitation.whatsappGroupUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
          >
            Entrar no grupo <ExternalLink className="h-4 w-4" />
          </a>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="min-w-0 rounded-2xl border border-amber-200/15 bg-white/[0.05] p-4 sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-amber-300/10 p-3 text-amber-300"><ClipboardList className="h-5 w-5" /></div>
              <div><h2 className="font-serif text-3xl text-white">Meus itens</h2><p className="mt-1 text-xs text-zinc-500">Tudo é opcional — contribua se quiser.</p></div>
            </div>
            <form onSubmit={(event) => void saveContribution(event)} className="space-y-5">
              <label className="block text-sm text-zinc-300">Comidas e bebidas
                <div className="relative mt-2"><Utensils className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" /><input value={contribution.food_and_drinks ?? ''} onChange={(event) => setContribution({ ...contribution, food_and_drinks: event.target.value })} placeholder="Ex.: sobremesa, espumante..." className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/60" /></div>
              </label>
              <label className="block text-sm text-zinc-300">Jogos de tabuleiro
                <div className="relative mt-2"><Gamepad2 className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" /><input value={contribution.board_games ?? ''} onChange={(event) => setContribution({ ...contribution, board_games: event.target.value })} placeholder="Ex.: Dixit, Uno..." className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/60" /></div>
              </label>
              <button type="submit" disabled={isSaving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Salvar meus itens</button>
            </form>
            {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
            {errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
          </section>

          <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3"><div><h2 className="font-serif text-3xl text-white">Lista geral</h2><p className="mt-1 text-xs text-zinc-500">Atualizada em tempo real</p></div><RefreshCw className="h-5 w-5 text-amber-300" /></div>
            {isLoading ? <div className="flex items-center justify-center py-16 text-zinc-500"><LoaderCircle className="h-6 w-6 animate-spin text-amber-300" /></div> : guests.length === 0 ? <p className="py-12 text-center text-sm text-zinc-500">Ainda não há convidados confirmados.</p> : <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500"><th className="px-3 pb-3 font-medium">Convidado</th><th className="px-3 pb-3 font-medium">Comidas / bebidas</th><th className="px-3 pb-3 font-medium">Jogos</th></tr></thead><tbody>{guests.map((item) => { const itemContribution = Array.isArray(item.contributions) ? item.contributions[0] : item.contributions; return <tr key={item.id} className="border-b border-white/5 last:border-0"><td className="max-w-[8rem] break-words px-3 py-4 font-medium text-zinc-200">{item.name}{item.id === guest.id && <span className="ml-2 text-xs font-normal text-amber-300">(você)</span>}</td><td className="max-w-[12rem] break-words px-3 py-4 text-zinc-400">{itemContribution?.food_and_drinks || <span className="text-zinc-700">—</span>}</td><td className="max-w-[12rem] break-words px-3 py-4 text-zinc-400">{itemContribution?.board_games || <span className="text-zinc-700">—</span>}</td></tr> })}</tbody></table></div>}
          </section>
        </div>
      </div>
    </main>
  )
}
