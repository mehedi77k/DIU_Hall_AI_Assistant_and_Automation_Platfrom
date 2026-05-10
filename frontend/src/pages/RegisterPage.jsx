import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:8000'

const initialForm = {
  full_name: '',
  student_id: '',
  email: '',
  phone: '',
  password: '',
  role: 'student',
}

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

function getRoleLabel(role) {
  if (role === 'admin') return 'Administrative'
  if (role === 'gate_security') return 'Gate Security'
  return 'Student'
}

function getIdPlaceholder(role) {
  if (role === 'admin') return 'Admin ID'
  if (role === 'gate_security') return 'Security ID'
  return 'Student ID'
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: form.full_name,
          student_id: form.student_id,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: form.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Registration failed'))
        return
      }

      setSuccess(`${getRoleLabel(form.role)} account created successfully.`)
      setForm(initialForm)

      setTimeout(() => {
        navigate('/login')
      }, 800)
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Register</h1>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Register As
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              style={{ marginTop: '8px' }}
            >
              <option value="student">Student</option>
              <option value="admin">Administrative</option>
              <option value="gate_security">Gate Security</option>
            </select>
          </label>

          <input
            name="full_name"
            type="text"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <input
            name="student_id"
            type="text"
            placeholder={getIdPlaceholder(form.role)}
            value={form.student_id}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="phone"
            type="text"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />

          {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : `Create ${getRoleLabel(form.role)} Account`}
          </button>
        </form>
      </div>
    </div>
  )
}