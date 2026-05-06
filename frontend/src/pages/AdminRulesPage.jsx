import { useEffect, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'

const initialForm = {
  rule_number: '',
  section: '',
  page: '',
  text: '',
}

export default function AdminRulesPage() {
  const token = sessionStorage.getItem('token')

  const [rules, setRules] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRules = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/rules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to load rules.')
        return
      }

      setRules(data)
    } catch (err) {
      setError('Could not connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm({
      ...form,
      [name]: value,
    })
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const handleEdit = (rule) => {
    setEditingId(rule.id)

    setForm({
      rule_number: String(rule.rule_number),
      section: rule.section,
      page: rule.page ? String(rule.page) : '',
      text: rule.text,
    })

    setError('')
    setSuccess('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      rule_number: Number(form.rule_number),
      section: form.section.trim(),
      page: form.page ? Number(form.page) : null,
      text: form.text.trim(),
    }

    const url = editingId
      ? `${API_BASE_URL}/api/v1/admin/rules/${editingId}`
      : `${API_BASE_URL}/api/v1/admin/rules`

    const method = editingId ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to save rule.')
        return
      }

      setSuccess(editingId ? 'Rule updated successfully.' : 'Rule added successfully.')
      resetForm()
      await loadRules()
    } catch (err) {
      setError('Could not connect to backend.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rule) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Rule ${rule.rule_number}?`
    )

    if (!confirmDelete) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/rules/${rule.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to delete rule.')
        return
      }

      setSuccess(data.message || 'Rule deleted successfully.')
      await loadRules()
    } catch (err) {
      setError('Could not connect to backend.')
    }
  }

  const handleRebuildIndex = async () => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/rules/rebuild-index`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to rebuild chatbot index.')
        return
      }

      setSuccess(`${data.message} Total indexed rules: ${data.total_rules}`)
    } catch (err) {
      setError('Could not connect to backend.')
    }
  }

  return (
    <div className="admin-rules-page">
      <div className="rules-page-header">
        <h1>Hall Rules Management</h1>

        <p>
          Admins can view, add, edit, and remove hall rules. The chatbot will
          answer according to these updated rules.
        </p>
      </div>

      {error && (
        <div className="card message-card error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="card message-card success-message">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="admin-rules-grid">
        <div className="card rules-form-card">
          <h2>{editingId ? 'Edit Rule' : 'Add New Rule'}</h2>

          <form onSubmit={handleSubmit}>
            <label>
              Rule Number
              <input
                type="number"
                name="rule_number"
                value={form.rule_number}
                onChange={handleChange}
                placeholder="Example: 99"
                required
              />
            </label>

            <label>
              Section
              <input
                type="text"
                name="section"
                value={form.section}
                onChange={handleChange}
                placeholder="Example: ROOM CLEANLINESS"
                required
              />
            </label>

            <label>
              Page
              <input
                type="number"
                name="page"
                value={form.page}
                onChange={handleChange}
                placeholder="Example: 1"
              />
            </label>

            <label>
              Rule Text
              <textarea
                name="text"
                value={form.text}
                onChange={handleChange}
                rows="6"
                placeholder="Write the rule text here..."
                required
              />
            </label>

            <div className="rules-action-row">
              <button type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Rule'
                    : 'Add Rule'}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <hr />

          <button type="button" onClick={handleRebuildIndex}>
            Rebuild Chatbot Index
          </button>
        </div>

        <div className="card rules-list-card">
          <div className="rules-list-header">
            <h2>All Rules</h2>
            <span>{rules.length} rules</span>
          </div>

          {loading && <p>Loading rules...</p>}

          {!loading && rules.length === 0 && <p>No rules found.</p>}

          {!loading && rules.length > 0 && (
            <div className="rules-scroll-area">
              <div className="list-wrap">
                {rules.map((rule) => (
                  <div key={rule.id} className="list-item rule-list-item">
                    <strong>
                      Rule {rule.rule_number} — {rule.section}
                    </strong>

                    <span>
                      <strong>Page:</strong> {rule.page || 'N/A'}
                    </span>

                    <span>
                      <strong>Status:</strong>{' '}
                      {rule.is_active ? 'Active' : 'Removed'}
                    </span>

                    <span>{rule.text}</span>

                    <div className="rules-action-row small-gap">
                      <button type="button" onClick={() => handleEdit(rule)}>
                        Edit
                      </button>

                      {rule.is_active && (
                        <button type="button" onClick={() => handleDelete(rule)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
