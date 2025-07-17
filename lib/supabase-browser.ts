import { createBrowserClient } from "@supabase/ssr"

/**
 * Returns a singleton Supabase browser client.
 * Only call this inside a client component or an event handler.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
