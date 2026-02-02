'use client'

import { useState } from 'react'
import { APIKeyManager } from '@/lib/apiKeyManager'

// React Hook for API Key Management
export function useAPIKeyManager(userId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storeKey = async (keyType: string, apiKey: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await APIKeyManager.storeAPIKey(keyType, apiKey, userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store API key')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getKey = async (keyType: string) => {
    setIsLoading(true)
    setError(null)

    try {
      return await APIKeyManager.getAPIKey(keyType, userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve API key')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateKey = async (keyType: string, newApiKey: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await APIKeyManager.updateAPIKey(keyType, newApiKey, userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeKey = async (keyType: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await APIKeyManager.removeAPIKey(keyType, userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const validateKey = async (keyType: string, apiKey: string) => {
    setIsLoading(true)
    setError(null)

    try {
      return await APIKeyManager.validateAPIKey(keyType, apiKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const hasKey = (keyType: string) => {
    return APIKeyManager.hasAPIKey(keyType, userId)
  }

  const getAllKeys = () => {
    return APIKeyManager.getAllStoredKeys(userId)
  }

  return {
    storeKey,
    getKey,
    updateKey,
    removeKey,
    validateKey,
    hasKey,
    getAllKeys,
    isLoading,
    error
  }
}