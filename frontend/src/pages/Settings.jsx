import { useState, useEffect } from 'react'
import api from '../api'

export default function Settings() {
  const [form, setForm] = useState({
    gmail_address: '',
    gmail_app_password: '',
    groq_api_key: '',
    send_delay_seconds: 35,
  })
  const [hasPassword, setHasPassword] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [testingGmail, setTestingGmail] = useState(false)
  const [testingGroq, setTestingGroq] = useState(false)
  const [testStatus, setTestStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        setForm((prev) => ({
          ...prev,
          gmail_address: res.data.gmail_address,
          send_delay_seconds: res.data.send_delay_seconds,
        }))
        setHasPassword(res.data.has_gmail_password)
        setHasKey(res.data.has_groq_key)
      })
      .catch(console.error)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'send_delay_seconds' ? parseInt(value, 10) : value,
    }))
  }

  const handleTestGmail = async () => {
    setTestingGmail(true)
    setTestStatus({ type: '', message: '' })
    try {
      const res = await api.post('/settings/test-gmail', {
        gmail_address: form.gmail_address,
        gmail_app_password: form.gmail_app_password,
      })
      setTestStatus({ type: 'success', message: res.data.message })
    } catch (err) {
      setTestStatus({ type: 'error', message: err.response?.data?.error || 'Gmail verification failed' })
    } finally {
      setTestingGmail(false)
    }
  }

  const handleTestGroq = async () => {
    setTestingGroq(true)
    setTestStatus({ type: '', message: '' })
    try {
      const res = await api.post('/settings/test-groq', {
        groq_api_key: form.groq_api_key,
      })
      setTestStatus({ type: 'success', message: res.data.message })
    } catch (err) {
      setTestStatus({ type: 'error', message: err.response?.data?.error || 'Groq verification failed' })
    } finally {
      setTestingGroq(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFlash('')
    setSaving(true)

    try {
      await api.post('/settings', form)
      setFlash('Settings saved successfully!')
      if (form.gmail_app_password) setHasPassword(true)
      if (form.groq_api_key) setHasKey(true)
      setTimeout(() => setFlash(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="settings-page" className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {flash ? (
        <div className="flash-message mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm animate-slide-down">
          {flash}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm animate-slide-down">
          {error}
        </div>
      ) : null}

      {testStatus.message ? (
        <div className={`mb-4 p-3 rounded-md text-sm animate-slide-down ${testStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {testStatus.type === 'success' ? '✓ ' : '✗ '}{testStatus.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Gmail Address */}
        <div>
          <label htmlFor="gmail-address" className="block text-sm font-medium text-gray-700 mb-1">
            Gmail Address
          </label>
          <input
            id="gmail-address"
            type="email"
            name="gmail_address"
            value={form.gmail_address}
            onChange={handleChange}
            placeholder="youremail@gmail.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Gmail App Password */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="gmail-password" className="block text-sm font-medium text-gray-700">
              Gmail App Password
              {hasPassword ? (
                <span className="ml-2 text-green-600 text-xs font-normal">✓ Configured</span>
              ) : null}
            </label>
          </div>
          <input
            id="gmail-password"
            type="password"
            name="gmail_app_password"
            value={form.gmail_app_password}
            onChange={handleChange}
            placeholder={hasPassword ? '••••••••••••••••' : 'Enter your 16-character app password'}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <div className="flex justify-between items-center mt-1.5 gap-2">
            <p className="text-xs text-gray-500">
              From <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google Security</a> → 2-Step Verification → App Passwords.
            </p>
            <button
              type="button"
              onClick={handleTestGmail}
              disabled={testingGmail || (!form.gmail_address && !hasPassword)}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded border border-gray-300 disabled:opacity-50 transition-colors shrink-0"
            >
              {testingGmail ? 'Testing...' : 'Test Gmail'}
            </button>
          </div>
        </div>

        {/* Groq API Key */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="groq-key" className="block text-sm font-medium text-gray-700">
              Groq API Key
              {hasKey ? (
                <span className="ml-2 text-green-600 text-xs font-normal">✓ Configured</span>
              ) : null}
            </label>
          </div>
          <input
            id="groq-key"
            type="password"
            name="groq_api_key"
            value={form.groq_api_key}
            onChange={handleChange}
            placeholder={hasKey ? '••••••••••••••••' : 'Enter your Groq API key'}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <div className="flex justify-between items-center mt-1.5 gap-2">
            <p className="text-xs text-gray-500">
              Get a free API key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">console.groq.com</a>.
            </p>
            <button
              type="button"
              onClick={handleTestGroq}
              disabled={testingGroq || (!form.groq_api_key && !hasKey)}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded border border-gray-300 disabled:opacity-50 transition-colors shrink-0"
            >
              {testingGroq ? 'Testing...' : 'Test Groq'}
            </button>
          </div>
        </div>

        {/* Send Delay */}
        <div>
          <label htmlFor="send-delay" className="block text-sm font-medium text-gray-700 mb-1">
            Delay Between Emails: {form.send_delay_seconds}s
          </label>
          <input
            id="send-delay"
            type="range"
            name="send_delay_seconds"
            min="35"
            max="90"
            value={form.send_delay_seconds}
            onChange={handleChange}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>35s</span>
            <span>90s</span>
          </div>
        </div>

        <button
          id="save-settings-btn"
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
