'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useAPIKeyManager, APIKeyManager } from '@/lib/apiKeyManager'
import {
  Settings,
  Key,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Shield,
  AlertTriangle
} from 'lucide-react'

interface APIKeyConfig {
  keyType: string
  displayName: string
  description: string
  required: boolean
  validationEndpoint?: string
}

const API_KEY_CONFIGS: APIKeyConfig[] = [
  {
    keyType: 'OPENROUTER',
    displayName: 'OpenRouter AI',
    description: 'Required for Renata AI assistant and code analysis',
    required: true,
    validationEndpoint: 'https://openrouter.ai/api/v1/models'
  },
  {
    keyType: 'POLYGON',
    displayName: 'Polygon.io',
    description: 'Required for real-time market data and scanning',
    required: true
  },
  {
    keyType: 'OPENAI',
    displayName: 'OpenAI',
    description: 'Required for CopilotKit features (optional)',
    required: false
  }
]

export default function DashboardPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { storeKey, getKey, removeKey, validateKey, hasKey, isLoading, error } = useAPIKeyManager(user?.id)

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (userLoaded && user) {
      loadExistingKeys()
    }
  }, [userLoaded, user])

  const loadExistingKeys = async () => {
    const keys: Record<string, string> = {}

    for (const config of API_KEY_CONFIGS) {
      const existingKey = await getKey(config.keyType)
      if (existingKey) {
        keys[config.keyType] = existingKey
      }
    }

    setApiKeys(keys)
  }

  const handleKeyChange = (keyType: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyType]: value }))
  }

  const toggleKeyVisibility = (keyType: string) => {
    setShowKeys(prev => ({ ...prev, [keyType]: !prev[keyType] }))
  }

  const validateApiKey = async (keyType: string, apiKey: string) => {
    if (!apiKey.trim()) return

    setValidating(prev => ({ ...prev, [keyType]: true }))

    try {
      const isValid = await validateKey(keyType, apiKey)
      setValidationResults(prev => ({ ...prev, [keyType]: isValid }))
    } catch (error) {
      setValidationResults(prev => ({ ...prev, [keyType]: false }))
    } finally {
      setValidating(prev => ({ ...prev, [keyType]: false }))
    }
  }

  const handleSaveKey = async (keyType: string) => {
    const apiKey = apiKeys[keyType]

    if (!apiKey.trim()) {
      return
    }

    setIsSaving(true)
    setSuccessMessage(null)

    try {
      await storeKey(keyType, apiKey)
      await validateApiKey(keyType, apiKey)
      setSuccessMessage(`${API_KEY_CONFIGS.find(c => c.keyType === keyType)?.displayName} API key saved successfully!`)

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save API key:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveKey = async (keyType: string) => {
    try {
      await removeKey(keyType)
      setApiKeys(prev => ({ ...prev, [keyType]: '' }))
      setValidationResults(prev => ({ ...prev, [keyType]: false }))
      setSuccessMessage(`${API_KEY_CONFIGS.find(c => c.keyType === keyType)?.displayName} API key removed successfully!`)

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to remove API key:', error)
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    setSuccessMessage(null)

    try {
      const savePromises = API_KEY_CONFIGS
        .filter(config => apiKeys[config.keyType]?.trim())
        .map(config => storeKey(config.keyType, apiKeys[config.keyType]))

      await Promise.all(savePromises)

      // Validate all saved keys
      for (const config of API_KEY_CONFIGS) {
        if (apiKeys[config.keyType]?.trim()) {
          await validateApiKey(config.keyType, apiKeys[config.keyType])
        }
      }

      setSuccessMessage('All API keys saved and validated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save API keys:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    window.location.href = '/sign-in'
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your API keys and account settings
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* API Keys Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                API Keys
              </h2>
              <div className="ml-auto">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {API_KEY_CONFIGS.map((config) => {
              const hasExistingKey = hasKey(config.keyType)
              const isValid = validationResults[config.keyType]
              const isValidating = validating[config.keyType]

              return (
                <div key={config.keyType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {config.displayName} {config.required && <span className="text-red-500">*</span>}
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>

                    {hasExistingKey && (
                      <div className="flex items-center space-x-2">
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : isValid === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : isValid === false ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showKeys[config.keyType] ? "text" : "password"}
                        value={apiKeys[config.keyType] || ''}
                        onChange={(e) => handleKeyChange(config.keyType, e.target.value)}
                        placeholder={`Enter your ${config.displayName} API key`}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility(config.keyType)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showKeys[config.keyType] ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => handleSaveKey(config.keyType)}
                      disabled={!apiKeys[config.keyType]?.trim() || isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </button>

                    {hasExistingKey && (
                      <button
                        onClick={() => handleRemoveKey(config.keyType)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSaveAll}
                disabled={isSaving || isLoading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Save All API Keys
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Secure Storage
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your API keys are encrypted using AES-256 encryption and stored securely in your browser.
                    They are never sent to our servers without your explicit consent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Go to Platform Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Trading Platform
          </a>
        </div>
      </div>
    </div>
  )
}