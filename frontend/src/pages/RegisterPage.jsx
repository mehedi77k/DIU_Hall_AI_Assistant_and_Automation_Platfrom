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

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Registration failed'))
        return
      }

      setSuccess('Registration successful. Please login now.')
      setForm(initialForm)

      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Register</h1>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>Register As</label>

          <select name="role" value={form.role} onChange={handleChange} required>
            <option value="student">Student</option>
            <option value="admin">Administrative</option>
          </select>

          <input
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <input
            name="student_id"
            placeholder={form.role === 'admin' ? 'Administrative ID' : 'Student ID'}
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
          />

          {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

          <button type="submit">
            {form.role === 'admin'
              ? 'Create Administrative Account'
              : 'Create Student Account'}
          </button>
        </form>
      </div>
    </div>
  )
}