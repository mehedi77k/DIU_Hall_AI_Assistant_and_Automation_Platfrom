import { useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:8000'

function getErrorMessage(data, fallback) {
  if (!data) return fallback

  if (typeof data.detail === 'string') {
    return data.detail
  }

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg).join(', ')
  }

  return fallback
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Password reset request failed'))
        return
      }

      setSuccess(data.message || 'Password reset link sent. Please check your email.')
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Forgot Password</h1>

        <p className="page-lead">
          Enter the email address used for your account. We will send a password reset link.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="auth-link-row">
            <Link to="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}