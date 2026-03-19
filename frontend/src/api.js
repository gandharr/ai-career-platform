import axios from 'axios'

const FALLBACK_PROD_API_URL = 'https://ai-career-platform-api.onrender.com'

const resolveApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || '').trim()

  if (import.meta.env.DEV) {
    return configured || 'http://localhost:8000'
  }

  if (!configured) {
    return FALLBACK_PROD_API_URL
  }

  try {
    const parsed = new URL(configured)
    if (parsed.hostname === 'api.render.com' || configured.includes('?key=')) {
      return FALLBACK_PROD_API_URL
    }
    return configured
  } catch {
    return FALLBACK_PROD_API_URL
  }
}

const resolvedApiBaseUrl = resolveApiBaseUrl()

const api = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 20000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your connection and try again.'
    }
    return Promise.reject(error)
  },
)

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

const isTransientNetworkError = (error) => {
  if (!error?.response) {
    return true
  }

  const status = error.response.status
  return [408, 429, 500, 502, 503, 504].includes(status)
}

const requestWithRetry = async (requestFn, retries = 1, delayMs = 350) => {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      if (attempt === retries || !isTransientNetworkError(error)) {
        break
      }
      await sleep(delayMs * (attempt + 1))
    }
  }

  throw lastError
}

const requestWithBackoff = async (requestFn, maxAttempts = 8, baseDelayMs = 1200) => {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || !isTransientNetworkError(error)) {
        break
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 10000)
      await sleep(delay)
    }
  }

  throw lastError
}

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export const registerUser = async (payload) => {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export const loginUser = async (payload) => {
  const { data } = await requestWithRetry(() => api.post('/auth/login', payload), 1)
  return data
}

export const parseResume = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await requestWithRetry(
    () => api.post('/parse-resume', formData, { timeout: 60000 }),
    1,
  )
  return data
}

export const recommendCareers = async (payload) => {
  const { data } = await requestWithRetry(
    () => api.post('/recommend-careers', payload, { timeout: 45000 }),
    1,
  )
  return data
}

export const getSkillGap = async (payload) => {
  const { data } = await api.post('/skill-gap', payload)
  return data
}

export const getLearningPath = async (payload) => {
  const { data } = await api.post('/learning-path', payload)
  return data
}

export const getUserProfile = async () => {
  const { data } = await requestWithRetry(() => api.get('/user/profile'), 1)
  return data
}

export const warmUpBackend = async () => {
  try {
    await requestWithBackoff(() => api.get('/health', { timeout: 15000 }), 8, 1000)
    return true
  } catch {
    return false
  }
}

export const pingBackendHealth = async () => {
  try {
    await api.get('/health', { timeout: 8000 })
    return true
  } catch {
    return false
  }
}
