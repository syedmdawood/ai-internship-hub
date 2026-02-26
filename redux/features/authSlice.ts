"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Session, User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  role: string | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
}

const initialState: AuthState = {
  user: null,
  session: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,
}
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload
      state.user = action.payload?.user ?? null
      state.role = action.payload?.user?.app_metadata?.role ?? null
      state.isAuthenticated = !!action.payload
      state.loading = false
      state.initialized = true   // 🔥 important
    },
    logout: (state) => {
      state.user = null
      state.session = null
      state.role = null
      state.isAuthenticated = false
    },
  },
})

export const { setSession, logout } = authSlice.actions
export default authSlice.reducer