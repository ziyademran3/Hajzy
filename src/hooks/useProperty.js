import { useState, useEffect } from 'react'
import { fetchProperties, fetchPropertyById, searchProperties } from '../api/propertyAPI'

export const useProperties = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        const data = await fetchProperties()
        setProperties(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [])

  return { properties, loading, error }
}

export const useProperty = (id) => {
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const loadProperty = async () => {
      try {
        setLoading(true)
        const data = await fetchPropertyById(id)
        setProperty(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [id])

  return { property, loading, error }
}

export const usePropertySearch = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async (query) => {
    if (!query) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      const data = await searchProperties(query)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, search }
}
