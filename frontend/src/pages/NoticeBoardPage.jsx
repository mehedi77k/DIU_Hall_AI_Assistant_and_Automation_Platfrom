import { useEffect, useState } from 'react'

const initialForm = {
  title: '',
  content: '',
  publish_date: '',
  deadline: '',
}

export default function NoticeBoardPage() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null')
  const token = sessionStorage.getItem('token')
  const formatDate = (value) => {
    if (!value) return ''
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
  }

  const [form, setForm] = useState(initialForm)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadNotices = async () => {
    const response = await fetch('http://127.0.0.1:18000/api/v1/notices')
    const data = await response.json()
    setItems(data)
  }

  useEffect(() => {
    loadNotices()
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const response = await fetch('http://127.0.0.1:18000/api/v1/notices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        deadline: form.deadline || null,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to publish notice')
      return
    }

    setSuccess('Notice published successfully.')
    setForm(initialForm)
    await loadNotices()
  }

  return (
    <div>
      <h1>Notice Board</h1>
      <p className="page-lead">
        {user?.role === 'admin'
          ? 'Administrative users can publish notices.'
          : 'Students can view all hall notices here.'}
      </p>

      <div className="two-column">
        <div className="card">
          {user?.role === 'admin' ? (
            <>
              <h3>Publish Notice</h3>

              <form onSubmit={handleSubmit} className="form-grid">
                <input
                  name="title"
                  placeholder="Notice Title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

                <input
                  name="publish_date"
                  type="date"
                  value={form.publish_date}
                  onChange={handleChange}
                  required
                />

                <input
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                />

                <textarea
                  name="content"
                  placeholder="Notice Content"
                  value={form.content}
                  onChange={handleChange}
                  required
                />

                {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
                {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

                <button type="submit">Publish Notice</button>
              </form>
            </>
          ) : (
            <>
              <h3>Student Access</h3>
              <p>Only administrative users can publish notices.</p>
              <p>You can view the published notices from the right-side panel.</p>
            </>
          )}
        </div>

        <div className="card">
          <h3>Notice List</h3>

          <div className="list-wrap">
            {items.map((item) => (
              <div key={item.id} className="list-item notice-item">
                <strong>{item.title}</strong>
                <span>{item.content}</span>
                <span>
                  <strong>Posted By:</strong> {item.posted_by}
                </span>
                <span>
                  <strong>Publish Date:</strong> {formatDate(item.created_at)}
                </span>
                {item.deadline && (
                  <span>
                    <strong>Deadline:</strong> {formatDate(item.deadline)}
                  </span>
                )}
              </div>
            ))}

            {items.length === 0 && <p>No notices published yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}



