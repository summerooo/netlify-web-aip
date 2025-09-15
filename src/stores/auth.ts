import { defineStore } from 'pinia'
import { ref } from 'vue'
import { signUp, signIn, signOut, getSession, onAuthStateChange } from '../api/auth'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const initializeAuth = async () => {
    if (initialized.value) return
    
    try {
      const session = await getSession()
      user.value = session?.user ?? null
      
      onAuthStateChange((event, session) => {
        user.value = session?.user ?? null
      })
      
      initialized.value = true
    } catch (error) {
      console.error('Auth initialization failed:', error)
      initialized.value = true
    }
  }

  const userSignUp = async (email: string, password: string, fullName?: string) => {
    loading.value = true
    try {
      const data = await signUp(email, password, fullName)
      return data
    } finally {
      loading.value = false
    }
  }

  const userSignIn = async (email: string, password: string) => {
    loading.value = true
    try {
      const data = await signIn(email, password)
      return data
    } finally {
      loading.value = false
    }
  }

  const userSignOut = async () => {
    loading.value = true
    try {
      await signOut()
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    initialized,
    initializeAuth,
    signUp: userSignUp,
    signIn: userSignIn,
    signOut: userSignOut
  }
})
