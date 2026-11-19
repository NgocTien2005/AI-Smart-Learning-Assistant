// A fresh hosted ADMIN bootstrap is opt-in and must never target local/shared DBs.
export const validateFreeDeployTarget = env => {
  const refused = () => { throw new Error('Free deploy target refused') }
  if (env.FREE_DEPLOY_TARGET_CONFIRMED !== 'NEW_EMPTY_PROJECT' || !/^[a-z0-9]{10,40}$/.test(env.EXPECTED_PROJECT_REF || '')) refused()
  let url
  try { url = new URL(env.DATABASE_URL) } catch { refused() }
  if (url.protocol !== 'postgresql:' || url.hostname !== env.EXPECTED_DATABASE_HOST || !url.hostname.endsWith('.pooler.supabase.com') || url.port !== '5432' || url.pathname !== '/postgres' || decodeURIComponent(url.username) !== `postgres.${env.EXPECTED_PROJECT_REF}` || url.searchParams.get('sslmode') !== 'verify-full' || url.searchParams.has('uselibpqcompat') || url.hash || !url.password) refused()
}
