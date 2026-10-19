import { useState } from 'react'
import { CalendarDays, Check, Clock3, LoaderCircle, MapPin, Sparkles, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import invitation from '../config/invitation.json'
import type { Guest, RsvpStatus } from '../types'

type RsvpScreenProps = {
  guest: Guest
  onUpdated: (status: RsvpStatus) => void
}

export function RsvpScreen({ guest, onUpdated }: RsvpScreenProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function updateRsvp(status: Exclude<RsvpStatus, 'pending'>) {
    if (!supabase) {
      setErrorMessage('A conexão com o convite ainda não foi configurada.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    const { error } = await supabase.from('guests').update({ rsvp_status: status }).eq('id', guest.id)

    if (error) {
      setErrorMessage('Não foi possível registrar sua resposta. Tente novamente.')
      setIsSaving(false)
      return
    }

    onUpdated(status)
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#09090b] px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      <section className="relative z-10 m-auto w-full max-w-2xl text-center">
        <Sparkles className="mx-auto mb-8 h-8 w-8 text-amber-300" />
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Convite especial</p>
        <h1 className="mt-5 font-serif text-6xl leading-none text-white sm:text-8xl">{invitation.title}</h1>
        <div className="mx-auto my-8 h-px w-24 bg-amber-300/60" />
        <p className="text-lg text-zinc-300">Olá, <span className="font-semibold text-amber-200">{guest.name}</span>!</p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-400">{invitation.message}</p>
        <div className="mx-auto mt-7 grid max-w-xl gap-2 text-left text-xs text-zinc-400 sm:grid-cols-3">
          <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <span>{invitation.date}</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <span>{invitation.time}</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 sm:col-span-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <span>{invitation.location}</span>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void updateRsvp('confirmed')}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            Confirmar presença
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void updateRsvp('declined')}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 font-medium text-zinc-300 transition hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-5 w-5" /> Não poderei ir
          </button>
        </div>
        {errorMessage && <p className="mt-5 text-sm text-red-300">{errorMessage}</p>}
      </section>
    </main>
  )
}
