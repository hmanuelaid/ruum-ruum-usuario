// lib/api.ts
export async function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  })
}