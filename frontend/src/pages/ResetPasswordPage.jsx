import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    new_password: '',
    confirm_new_password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = searchParams.get('token') || ''

  useEffect(() => {
    const emailFromUrl = searchParams.get('email') || ''

    if (emailFromUrl) {
      setForm((prev) => ({
        ...prev,
        email: emailFromUrl,
      }))
    }
  }, [searchParams])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Reset token is missing. Please request a new reset link.')
      return
    }

    if (form.new_password !== form.confirm_new_password) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          token,
          new_password: form.new_password,
          confirm_new_password: form.confirm_new_password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Password reset failed'))
        return
      }

      navigate('/login')
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Reset Password</h1>

        <p className="page-lead">
          Enter your email address and new password.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="new_password"
            placeholder="New password"
            value={form.new_password}
            onChange={handleChange}
            required
            minLength={6}
          />

          <input
            type="password"
            name="confirm_new_password"
            placeholder="Confirm new password"
            value={form.confirm_new_password}
            onChange={handleChange}
            required
            minLength={6}
          />

          {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Back to login'}
          </button>

          <div className="auth-link-row">
            <Link to="/login">Cancel and go back to login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}