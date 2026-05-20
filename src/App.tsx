import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/Login'
import { HomePage } from '@/pages/Home'
import { CompanyPage } from '@/pages/CompanyPage'
import { SupplierPage } from '@/pages/SupplierPage'
import { FreightPage } from '@/pages/FreightPage'
import { SettingsPage } from '@/pages/SettingsPage'
import type { Profile } from '@/types'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: ':company', element: <CompanyPage /> },
      { path: ':company/frete', element: <FreightPage /> },
      { path: ':company/:supplierId', element: <SupplierPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function App() {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const fetchOrCreateProfile = async (userId: string, email?: string): Promise<Profile | null> => {
      // maybeSingle returns null (not 406) when no row exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (existing) return existing as Profile

      // Profile not found — create one (trigger may not have fired if user pre-existed the schema)
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: userId, name: email ?? null, role: 'viewer' })
        .select('*')
        .maybeSingle()

      return created as Profile | null
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user.id, session.user.email)
        setProfile(profile)
      }
      setLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const profile = await fetchOrCreateProfile(session.user.id, session.user.email)
          setProfile(profile)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading])

  return <RouterProvider router={router} />
}
