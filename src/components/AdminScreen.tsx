import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, Copy, LogOut, Plus, RefreshCw, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Guest } from '../types'

const ADMIN_EMAIL = 'pedrohr1507@gmail.com'

export function AdminScreen() {
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setErrorMessage('A conexão com o Supabase ainda não foi configurada.')
      setIsLoading(false)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const currentEmail = data.session?.user.email?.toLowerCase() ?? null
      setSessionEmail(currentEmail === ADMIN_EMAIL ? currentEmail : null)
      setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      const currentEmail = currentSession?.user.email?.toLowerCase() ?? null
      setSessionEmail(currentEmail === ADMIN_EMAIL ? currentEmail : null)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (sessionEmail) void loadGuests()
  }, [sessionEmail])

  async function loadGuests() {
    if (!supabase) return
    setIsLoading(true)
    const { data, error } = await supabase.from('guests').select('id, name, rsvp_status').order('name')
    if (error) {
      setErrorMessage('Não foi possível carregar os convites.')
    } else {
      setGuests((data ?? []) as Guest[])
    }
    setIsLoading(false)
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setErrorMessage('')
    setIsSaving(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMessage('E-mail ou senha inválidos.')
    setPassword('')
    setIsSaving(false)
  }

  async function createGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !name.trim()) return
    setErrorMessage('')
    setSuccessMessage('')
    setIsSaving(true)
    const { error } = await supabase.from('guests').insert({ name: name.trim() })
    if (error) {
      setErrorMessage('Não foi possível criar o convite.')
    } else {
      setName('')
      setSuccessMessage('Convite criado com sucesso.')
      await loadGuests()
    }
    setIsSaving(false)
  }

  async function deleteGuest(guest: Guest) {
    if (!supabase || !window.confirm(`Excluir o convite de ${guest.name}?`)) return
    setErrorMessage('')
    const { error } = await supabase.from('guests').delete().eq('id', guest.id)
    if (error) {
      setErrorMessage('Não foi possível excluir este convite.')
    } else {
      setGuests((currentGuests) => currentGuests.filter((currentGuest) => currentGuest.id !== guest.id))
    }
  }

  async function copyLink(guestId: string) {
    const link = `${window.location.origin}/?guest_id=${guestId}`
    await navigator.clipboard.writeText(link)
    setCopiedId(guestId)
    window.setTimeout(() => setCopiedId(null), 1800)
  }

  const summary = useMemo(() => ({
    total: guests.length,
    confirmed: guests.filter((guest) => guest.rsvp_status === 'confirmed').length,
    pending: guests.filter((guest) => guest.rsvp_status === 'pending').length,
    declined: guests.filter((guest) => guest.rsvp_status === 'declined').length,
  }), [guests])

  if (isLoading && !sessionEmail) {
    return <AdminShell><p className="text-center text-zinc-400">Carregando área administrativa...</p></AdminShell>
  }

  if (!sessionEmail) {
    return (
      <AdminShell>
        <form onSubmit={(event) => void signIn(event)} className="mx-auto w-full max-w-md rounded-3xl border border-amber-200/15 bg-white/[0.06] p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-9">
          <ShieldCheck className="mx-auto mb-5 h-10 w-10 text-amber-300" />
          <h1 className="text-center font-serif text-4xl text-white">Área administrativa</h1>
          <p className="mt-2 text-center text-sm text-zinc-400">Entre para gerenciar os convites.</p>
          <label className="mt-7 block text-sm text-zinc-300">E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none focus:border-amber-300/60" required /></label>
          <label className="mt-4 block text-sm text-zinc-300">Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none focus:border-amber-300/60" required /></label>
          <button type="submit" disabled={isSaving} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 font-semibold text-zinc-950 disabled:opacity-60">{isSaving ? 'Entrando...' : 'Entrar'}</button>
          {errorMessage && <p className="mt-4 text-center text-sm text-red-300">{errorMessage}</p>}
        </form>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">Réveillon 2027</p><h1 className="mt-2 font-serif text-5xl text-white">Convites</h1><p className="mt-2 text-sm text-zinc-400">Gerencie convidados e links individuais.</p></div>
        <button type="button" onClick={() => void supabase?.auth.signOut()} className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white sm:self-auto"><LogOut className="h-4 w-4" /> Sair</button>
      </header>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries({ Total: summary.total, Confirmados: summary.confirmed, Pendentes: summary.pending, Recusados: summary.declined }).map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-2xl font-semibold text-amber-200">{value}</p></div>)}
      </div>
      <form onSubmit={(event) => void createGuest(event)} className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200/15 bg-white/[0.05] p-5 sm:flex-row">
        <div className="flex flex-1 items-center gap-3"><UserPlus className="h-5 w-5 text-amber-300" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do novo convidado" className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600" required /></div>
        <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 font-semibold text-zinc-950 disabled:opacity-60"><Plus className="h-4 w-4" /> Criar convite</button>
      </form>
      {successMessage && <p className="mb-4 text-sm text-emerald-300">{successMessage}</p>}
      {errorMessage && <p className="mb-4 text-sm text-red-300">{errorMessage}</p>}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 p-5"><h2 className="font-serif text-3xl text-white">Convidados</h2><button type="button" onClick={() => void loadGuests()} className="rounded-lg p-2 text-zinc-400 hover:text-white" aria-label="Atualizar"><RefreshCw className="h-5 w-5" /></button></div>
        {isLoading ? <p className="p-8 text-center text-zinc-500">Carregando...</p> : guests.length === 0 ? <p className="p-8 text-center text-zinc-500">Nenhum convite criado.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500"><th className="px-5 py-3">Nome</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody>{guests.map((guest) => <tr key={guest.id} className="border-b border-white/5 last:border-0"><td className="px-5 py-4 font-medium text-zinc-200">{guest.name}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${guest.rsvp_status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-300' : guest.rsvp_status === 'declined' ? 'bg-red-400/10 text-red-300' : 'bg-amber-300/10 text-amber-200'}`}>{guest.rsvp_status === 'confirmed' ? 'Confirmado' : guest.rsvp_status === 'declined' ? 'Recusado' : 'Pendente'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => void copyLink(guest.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-amber-300/40 hover:text-amber-200">{copiedId === guest.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiedId === guest.id ? 'Copiado' : 'Copiar link'}</button><button type="button" onClick={() => void deleteGuest(guest)} className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-400/10" aria-label={`Excluir ${guest.name}`}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
      </section>
    </AdminShell>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#09090b] px-4 py-8 text-zinc-100 sm:px-6 lg:px-8"><div className="mx-auto w-full max-w-5xl">{children}<div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-600"><Clipboard className="h-3.5 w-3.5" /> Acesso restrito</div></div></main>
}
