import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useApi<T>(url: string, params?: Record<string, any>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (overrideParams?: Record<string, any>) => {
    setLoading(true)
    try {
      const res = await api.get(url, { params: overrideParams ?? params })
      setData(res.data)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [url, JSON.stringify(params)])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
