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
      { path: 'madeiras', element: <CompanyPage /> },
      { path: 'madeiras/frete', element: <FreightPage /> },
      { path: 'madeiras/:supplierId', element: <SupplierPage /> },
      { path: 'pellets', element: <CompanyPage /> },
      { path: 'pellets/frete', element: <FreightPage /> },
      { path: 'pellets/:supplierId', element: <SupplierPage /> },
      { path: 'settings', element: <SettingsPage /> },
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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data as Profile | null)
      }
      setLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data as Profile | null)
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
