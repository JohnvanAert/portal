'use client'

import { signOut } from "next-auth/react"
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const handleSignOut = async () => {
    // Вызываем signOut без редиректа, чтобы он просто удалил куки,
    // а потом сами редиректим через window.location
    await signOut({ redirect: false })
    window.location.href = '/login'
  }

  return (
    <button 
      onClick={handleSignOut}
      className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
    >
      <LogOut size={20} />
      <span>Выйти</span>
    </button>
  )
}