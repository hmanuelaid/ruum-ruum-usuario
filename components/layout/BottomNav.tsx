'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/inicio', label: 'Inicio',
    icon: <svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>,
  },
  {
    href: '/solicitar', label: 'Solicitar',
    icon: <svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  },
  {
    href: '/viajes', label: 'Mis viajes',
    icon: <svg viewBox="0 0 24 24"><path d="M5 17h14"/><path d="M7 17v2"/><path d="M17 17v2"/><path d="m6 13 1.5-5h9L18 13"/><path d="M4 13h16v4H4Z"/></svg>,
  },
  {
    href: '/evidencia', label: 'Evidencia',
    icon: <svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3"/></svg>,
  },
  {
    href: '/cuenta', label: 'Cuenta',
    icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV.map(({ href, label, icon }) => (
        <Link key={href} href={href}
          className={`nav-item${pathname === href ? ' is-active' : ''}`}
          aria-current={pathname === href ? 'page' : undefined}>
          {icon}
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}