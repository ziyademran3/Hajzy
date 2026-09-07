/**
 * Google Identity Services (GIS) integration for real device Google account chooser.
 */

export const DEFAULT_GOOGLE_CLIENT_ID = '899816567797-sb2kohhsvg3748dm7eb87bag3f67v83d.apps.googleusercontent.com'

export const getGoogleClientId = () => {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem('hajzy_google_client_id') ||
    DEFAULT_GOOGLE_CLIENT_ID ||
    ''
  )
}

export const setGoogleClientId = (clientId) => {
  if (clientId) {
    localStorage.setItem('hajzy_google_client_id', clientId.trim())
  } else {
    localStorage.removeItem('hajzy_google_client_id')
  }
}

export const loadGoogleGsiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google)
      return
    }

    const existingScript = document.getElementById('google-gsi-client')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google))
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gsi-client'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = (err) => reject(new Error('Failed to load Google Identity Services: ' + err))
    document.head.appendChild(script)
  })
}

/**
 * Initiates the Google OAuth 2.0 flow with prompt: 'select_account'
 * to show all Google accounts on the device/browser.
 */
export const triggerGoogleLogin = async (clientIdOverride = null) => {
  const clientId = (clientIdOverride || getGoogleClientId()).trim()

  if (!clientId) {
    throw new Error('MISSING_CLIENT_ID')
  }

  await loadGoogleGsiScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not available')
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error))
          return
        }

        try {
          // Fetch the user's Google profile
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          })

          if (!res.ok) {
            throw new Error(`Failed to fetch user profile: ${res.statusText}`)
          }

          const profile = await res.json()

          resolve({
            id: profile.sub,
            name: profile.name || profile.email.split('@')[0],
            email: profile.email,
            avatar: profile.picture,
            role: 'user',
            provider: 'google',
          })
        } catch (fetchErr) {
          reject(fetchErr)
        }
      },
      error_callback: (err) => {
        reject(new Error(err.message || 'Google Sign-In failed'))
      },
    })

    // Request access token with select_account prompt to list all device accounts
    tokenClient.requestAccessToken({ prompt: 'select_account' })
  })
}
