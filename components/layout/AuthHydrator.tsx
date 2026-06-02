'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import type { User } from '@/lib/types'

export default function AuthHydrator({ user }: { user: User }) {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser(user)
  }, [setUser, user])

  return null
}
