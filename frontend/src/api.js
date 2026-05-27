const API = 'https://bistro-pos-production.up.railway.app/api'

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

export const login = (username, password) =>
  fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(r => r.json())

export const getMenu = () => fetch(`${API}/menu`, { headers: authHeaders() }).then(handleResponse)
export const addMenuItem = (data) => fetch(`${API}/menu`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const updateMenuItem = (id, data) => fetch(`${API}/menu/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const deleteMenuItem = (id) => fetch(`${API}/menu/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)

export const getUsers = () => fetch(`${API}/users`, { headers: authHeaders() }).then(handleResponse)
export const addUser = (data) => fetch(`${API}/users`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const deleteUser = (id) => fetch(`${API}/users/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)
export const updateUser = (id, data) => fetch(`${API}/users/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)

export const getTables = () => fetch(`${API}/tables`, { headers: authHeaders() }).then(handleResponse)
export const updateTable = (id, data) => fetch(`${API}/tables/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const updateTableByNumber = (number, data) => fetch(`${API}/tables/number/${number}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)

export const getTransactions = () => fetch(`${API}/transactions`, { headers: authHeaders() }).then(handleResponse)
export const addTransaction = (data) => fetch(`${API}/transactions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const voidTransaction = (id, data) => fetch(`${API}/transactions/${id}/void`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const clearTransactions = () => fetch(`${API}/transactions`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse)

export const getShifts = () => fetch(`${API}/shifts`, { headers: authHeaders() }).then(handleResponse)
export const getActiveShift = () => fetch(`${API}/shifts/active`, { headers: authHeaders() }).then(handleResponse)
export const openShift = (data) => fetch(`${API}/shifts/open`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const closeShift = (id, data) => fetch(`${API}/shifts/${id}/close`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)

export const getKitchenOrders = () => fetch(`${API}/kitchen/orders`, { headers: authHeaders() }).then(handleResponse)
export const addKitchenOrder = (data) => fetch(`${API}/kitchen/orders`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse)
export const updateKitchenOrderStatus = (id, status) => fetch(`${API}/kitchen/orders/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) }).then(handleResponse)

export const getLowStockAlerts = (threshold = 10) => fetch(`${API}/alerts/low-stock?threshold=${threshold}`, { headers: authHeaders() }).then(handleResponse)