import { createBrowserClient } from "@supabase/ssr"

/**
 * Returns a singleton Supabase browser client.
 * Only call this inside a client component or an event handler.
 */
export function createSupabaseBrowser() {

  return createBrowserClient("https://twnshjxnpixestkpbtyh.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bnNoanhucGl4ZXN0a3BidHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDA3NDEsImV4cCI6MjA2NzgxNjc0MX0.sabKgCCWHBDRKbR2iLeg02EgjYh6fQNPJCUlfcEjHRc")
}
