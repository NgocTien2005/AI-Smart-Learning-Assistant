export const roleHome = (role) => role === 'ADMIN' ? '/admin' : '/dashboard'

export const resolvePostLoginDestination = (from, role, origin = 'http://localhost') => {
  const fallback = roleHome(role)
  if (!from) return fallback
  const pathname = typeof from === 'string' ? from : from.pathname
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) return fallback
  const search = typeof from === 'object' && typeof from.search === 'string' ? from.search : ''
  const hash = typeof from === 'object' && typeof from.hash === 'string' ? from.hash : ''
  let destination
  try {
    destination = new URL(`${pathname}${search}${hash}`, origin)
  } catch {
    return fallback
  }
  const routePath = destination.pathname.replace(/\/+$/, '').toLowerCase()
  if (destination.origin !== origin || ['/auth', '/reset-password'].includes(routePath)) return fallback
  if (role === 'ADMIN' && !['/admin', '/account'].includes(routePath)) return fallback
  if (role !== 'ADMIN' && routePath.startsWith('/admin')) return fallback
  return `${destination.pathname}${destination.search}${destination.hash}`
}
