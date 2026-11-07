let loading

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.referrerPolicy = location.hostname === 'localhost' ? 'no-referrer-when-downgrade' : 'strict-origin-when-cross-origin'
    const timer = window.setTimeout(() => fail(), 10000)
    function fail() {
      window.clearTimeout(timer)
      script.remove()
      loading = undefined
      reject(new Error('Chưa tải được Google. Hãy thử lại hoặc dùng email và mật khẩu.'))
    }
    script.onerror = fail
    script.onload = () => {
      window.clearTimeout(timer)
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else fail()
    }
    document.head.append(script)
  })
  return loading
}
