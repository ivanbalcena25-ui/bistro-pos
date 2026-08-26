const API = 'http://localhost:5000/api'

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').token || '' } catch { return '' }
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Session expired. Please login again.')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ─── SIMPLE IN-MEMORY CACHE ────────────────────────────────────────────────
const cache = {}
const CACHE_TTL = 8000 // 8 seconds

function getCached(key) {
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { delete cache[key]; return null }
  return entry.data
}
function setCached(key, data) {
  cache[key] = { ts: Date.now(), data }
}
export function bustCache(key) {
  if (key) delete cache[key]
  else Object.keys(cache).forEach(k => delete cache[k])
}

async function cachedFetch(key, url, opts) {
  const hit = getCached(key)
  if (hit) return hit
  const res = await fetch(url, opts)
  const data = await handleResponse(res)
  setCached(key, data)
  return data
}
// ───────────────────────────────────────────────────────────────────────────

export const login = (username, password) =>
  fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(r => r.json())

export const getMenu = () => cachedFetch('menu', `${API}/menu`, { headers: authHeaders() })
export const addMenuItem = (data) => {
  bustCache('menu')
  return fetch(`${API}/menu`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const updateMenuItem = (id, data) => {
  bustCache('menu')
  return fetch(`${API}/menu/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const deleteMenuItem = (id) => {
  bustCache('menu')
  return fetch(`${API}/menu/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)
}

export const getUsers = () => cachedFetch('users', `${API}/users`, { headers: authHeaders() })
export const addUser = (data) => {
  bustCache('users')
  return fetch(`${API}/users`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const deleteUser = (id) => {
  bustCache('users')
  return fetch(`${API}/users/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)
}
export const updateUser = (id, data) => {
  bustCache('users')
  return fetch(`${API}/users/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}

export const getTables = () => cachedFetch('tables', `${API}/tables`, { headers: authHeaders() })
export const updateTable = (id, data) => {
  bustCache('tables')
  return fetch(`${API}/tables/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const updateTableByNumber = (number, data) => {
  bustCache('tables')
  return fetch(`${API}/tables/number/${number}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const addTable = () => {
  bustCache('tables')
  return fetch(`${API}/tables`, { method: 'POST', headers: authHeaders() }).then(handleResponse)
}
export const deleteTable = (id) => {
  bustCache('tables')
  return fetch(`${API}/tables/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)
}

export const getTransactions = () => cachedFetch('transactions', `${API}/transactions`, { headers: authHeaders() })
export const addTransaction = (data) => {
  bustCache('transactions')
  return fetch(`${API}/transactions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const voidTransaction = (id, data) => {
  bustCache('transactions')
  return fetch(`${API}/transactions/${id}/void`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const clearTransactions = () => {
  bustCache('transactions')
  return fetch(`${API}/transactions`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)
}

export const getShifts = () => cachedFetch('shifts', `${API}/shifts`, { headers: authHeaders() })
export const getActiveShift = () => cachedFetch('shift_active', `${API}/shifts/active`, { headers: authHeaders() })
export const openShift = (data) => {
  bustCache('shifts'); bustCache('shift_active')
  return fetch(`${API}/shifts/open`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const closeShift = (id, data) => {
  bustCache('shifts'); bustCache('shift_active')
  return fetch(`${API}/shifts/${id}/close`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}

export const getKitchenOrders = () => cachedFetch('kitchen_orders', `${API}/kitchen/orders`, { headers: authHeaders() })
export const addKitchenOrder = (data) => {
  bustCache('kitchen_orders')
  return fetch(`${API}/kitchen/orders`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
}
export const updateKitchenOrderStatus = (id, status) => {
  bustCache('kitchen_orders')
  return fetch(`${API}/kitchen/orders/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) }).then(handleResponse)
}

export const getLowStockAlerts = (threshold = 10) =>
  cachedFetch(`low_stock_${threshold}`, `${API}/alerts/low-stock?threshold=${threshold}`, { headers: authHeaders() })