"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAppDispatch } from "@/redux/hooks"
import { setSession } from "@/redux/features/authSlice"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      dispatch(setSession(data.session))
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        dispatch(setSession(session))
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [dispatch])

  return <>{children}</>
}