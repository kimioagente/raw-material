import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Layers, Truck, Settings, LogOut, ChevronRight, TreePine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { PeriodSelector } from './PeriodSelector'
import { ImportModal } from '@/components/import/ImportModal'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand text-white'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
  )

export function AppShell() {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-stone-200 bg-white">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-stone-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand">
            <TreePine className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-stone-900">MatériaPrima</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Empresas
          </p>
          <NavLink to="/app/madeiras" className={navLinkClass}>
            <Layers className="h-4 w-4" />
            Madeiras Rodrigues
          </NavLink>
          <NavLink to="/app/pellets" className={navLinkClass}>
            <Layers className="h-4 w-4" />
            Pellets Rodrigues
          </NavLink>

          <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Frete
          </p>
          <NavLink to="/app/madeiras/frete" className={navLinkClass}>
            <Truck className="h-4 w-4" />
            Frete Madeiras
          </NavLink>
          <NavLink to="/app/pellets/frete" className={navLinkClass}>
            <Truck className="h-4 w-4" />
            Frete Pellets
          </NavLink>

          <div className="mt-auto pt-4">
            <NavLink to="/app/settings" className={navLinkClass}>
              <Settings className="h-4 w-4" />
              Configurações
            </NavLink>
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-stone-200 p-3">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
              {profile?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-stone-800">{profile?.name ?? '—'}</p>
              <p className="text-[10px] text-stone-400 capitalize">{profile?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleSignOut}
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-6">
          <div className="flex items-center gap-1 text-sm text-stone-400">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector />
            <ImportModal />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
