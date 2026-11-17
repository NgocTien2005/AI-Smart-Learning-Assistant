export function validateAdminBootstrap(env) {
  const name=env.ADMIN_BOOTSTRAP_NAME?.trim()
  const email=env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase()
  const password=env.ADMIN_BOOTSTRAP_PASSWORD
  if(!name||name.length<2||name.length>80)throw new Error('ADMIN_BOOTSTRAP_NAME must be between 2 and 80 characters.')
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address.')
  if(typeof password!=='string'||password.length<12||password.length>72)throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be between 12 and 72 characters.')
  return {name,email,password}
}
