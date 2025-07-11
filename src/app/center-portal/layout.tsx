import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CenterPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Allow access to login and register pages without authentication
  const publicPaths = ['/center-portal/login', '/center-portal/register']
  const currentPath = '/center-portal' // This will be dynamic in actual implementation
  
  if (!session && !publicPaths.some(path => currentPath.startsWith(path))) {
    redirect('/center-portal/login')
  }

  // If authenticated, check if user has center_manager role
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'center_manager' && !publicPaths.some(path => currentPath.startsWith(path))) {
      redirect('/center-portal/unauthorized')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
