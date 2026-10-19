import { useEffect, useState } from 'react'
import { AlertCircle, Check, LoaderCircle, PartyPopper, Sparkles } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import { DashboardScreen } from './components/DashboardScreen'
import { AdminScreen } from './components/AdminScreen'
import { RsvpScreen } from './components/RsvpScreen'
import type { Guest, RsvpStatus } from './types'

type ViewState = 'loading' | 'error' | 'rsvp' | 'dashboard' | 'declined'

function App() {
  if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
    return <AdminScreen />
  }

  return <GuestApp />
}

function GuestApp() {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [view, setView] = useState<ViewState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    const guestId = new URLSearchParams(window.location.search).get('guest_id')

    async function loadGuest() {
      if (!guestId) {
        if (active) {
          setErrorMessage('O link do convite não contém um identificador de convidado.')
          setView('error')
        }
        return
      }

      if (!supabase) {
        if (active) {
          setErrorMessage('A conexão com o convite ainda não foi configurada.')
          setView('error')
        }
        return
      }

      const { data, error } = await supabase
        .from('guests')
        .select('id, name, rsvp_status')
        .eq('id', guestId)
        .maybeSingle()

      if (!active) return

      if (error) {
        setErrorMessage('Não foi possível carregar seu convite. Tente novamente em instantes.')
        setView('error')
        return
      }

      if (!data) {
        setErrorMessage('Este convite não foi encontrado ou o link não é mais válido.')
        setView('error')
        return
      }

      const loadedGuest = data as Guest
      setGuest(loadedGuest)
      setView(loadedGuest.rsvp_status === 'pending' ? 'rsvp' : loadedGuest.rsvp_status === 'confirmed' ? 'dashboard' : 'declined')
    }

    void loadGuest()
    return () => {
      active = false
    }
  }, [])

  function handleRsvpUpdated(status: RsvpStatus) {
    setGuest((currentGuest) => (currentGuest ? { ...currentGuest, rsvp_status: status } : currentGuest))
    setView(status === 'confirmed' ? 'dashboard' : 'declined')
  }

  if (view === 'loading') return <LoadingScreen />

  if (view === 'error') {
    return (
      <StatusScreen
        icon={<AlertCircle className="h-8 w-8" />}
        title="Convite indisponível"
        message={errorMessage}
      />
    )
  }

  if (view === 'declined') {
    return (
      <StatusScreen
        icon={<Check className="h-8 w-8" />}
        title="Obrigado por avisar"
        message="Sentiremos sua falta na virada! Desejamos um excelente Ano Novo."
      />
    )
  }

  if (!guest) return null

  return view === 'rsvp' ? (
    <RsvpScreen guest={guest} onUpdated={handleRsvpUpdated} />
  ) : (
    <DashboardScreen guest={guest} />
  )
}

function CelebrationShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#09090b] px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">{children}</div>
    </main>
  )
}

function LoadingScreen() {
  return (
    <CelebrationShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Sparkles className="mb-6 h-10 w-10 animate-pulse text-amber-300" />
        <p className="font-serif text-3xl text-amber-100">Preparando a celebração...</p>
        <LoaderCircle className="mt-6 h-5 w-5 animate-spin text-amber-400" />
      </div>
    </CelebrationShell>
  )
}

function StatusScreen({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <CelebrationShell>
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full max-w-lg rounded-3xl border border-amber-200/20 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-300">
            {icon}
          </div>
          <h1 className="font-serif text-4xl text-white">{title}</h1>
          <p className="mt-4 leading-7 text-zinc-400">{message}</p>
          <PartyPopper className="mx-auto mt-8 h-6 w-6 text-amber-300/70" />
        </section>
      </div>
    </CelebrationShell>
  )
}

export default App
