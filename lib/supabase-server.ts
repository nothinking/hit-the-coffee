import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient("https://twnshjxnpixestkpbtyh.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bnNoanhucGl4ZXN0a3BidHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDA3NDEsImV4cCI6MjA2NzgxNjc0MX0.sabKgCCWHBDRKbR2iLeg02EgjYh6fQNPJCUlfcEjHRc", {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      // setAll is needed for auth flows even if you don’t use them yet
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          /* called from a Server Component – ignore */
        }
      },
    },
  })
}
