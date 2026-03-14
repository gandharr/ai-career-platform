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
})

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
  const { data } = await api.post('/auth/login', payload)
  return data
}

export const parseResume = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/parse-resume', formData)
  return data
}

export const recommendCareers = async (payload) => {
  const { data } = await api.post('/recommend-careers', payload)
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
  const { data } = await api.get('/user/profile')
  return data
}
