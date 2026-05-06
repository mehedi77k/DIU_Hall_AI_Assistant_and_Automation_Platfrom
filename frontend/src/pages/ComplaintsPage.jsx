import { useEffect, useState } from 'react'

const initialForm = {
  room_no: '',
  category: '',
  description: '',
}

export default function ComplaintsPage() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null')
  const token = sessionStorage.getItem('token')
  const isAdmin = user?.role === 'admin'
  const isActionableStatus = (status) => status === 'submitted' || status === 'pending'

  const [form, setForm] = useState(initialForm)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadComplaints = async () => {
    setError('')

    const response = await fetch('http://127.0.0.1:18000/api/v1/complaints', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to load complaints')
      return
    }

    setItems(data)
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const response = await fetch('http://127.0.0.1:18000/api/v1/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to submit complaint')
      return
    }

    setSuccess('Complaint submitted successfully.')
    setForm(initialForm)
    await loadComplaints()
  }

  const handleStatusUpdate = async (complaintId, status) => {
    setError('')
    setSuccess('')

    const response = await fetch(
      `http://127.0.0.1:18000/api/v1/complaints/${complaintId}/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to update complaint status')
      return
    }

    setSuccess('Complaint status updated.')
    await loadComplaints()
  }

  return (
    <div>
      <h1>Complaint Box</h1>
      <p className="page-lead">
        {user?.role === 'student'
          ? 'Only logged-in students can submit complaints.'
          : 'Administrative users can view all complaints.'}
      </p>

      <div className="two-column">
        <div className="card">
          {user?.role === 'student' ? (
            <>
              <h3>Submit Complaint</h3>

              <div style={{ marginBottom: '14px', color: '#475569' }}>
                <strong>Name:</strong> {user.full_name}
                <br />
                <strong>ID:</strong> {user.student_id}
              </div>

              <form onSubmit={handleSubmit} className="form-grid">
                <input
                  name="room_no"
                  placeholder="Room No"
                  value={form.room_no}
                  onChange={handleChange}
                  required
                />

                <input
                  name="category"
                  placeholder="Category"
                  value={form.category}
                  onChange={handleChange}
                  required
                />

                <textarea
                  name="description"
                  placeholder="Complaint Description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />

                {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
                {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

                <button type="submit">Submit Complaint</button>
              </form>
            </>
          ) : (
            <>
              <h3>Administrative Access</h3>
              <p>Administrative users cannot submit complaints.</p>
              <p>You can view all complaints from the right-side panel.</p>
            </>
          )}
        </div>

        <div className="card">
          <h3>{isAdmin ? 'All Complaints' : 'My Complaints'}</h3>

          <div className="list-wrap">
            {success && <p style={{ color: '#198754', margin: 0 }}>{success}</p>}
            {items.map((item) => (
              <div key={item.id} className="list-item">
                <strong>{item.student_name}</strong>
                <span>
                  <strong>ID:</strong> {item.student_id}
                </span>
                <span>
                  <strong>Room:</strong> {item.room_no}
                </span>
                <span>
                  <strong>Category:</strong> {item.category}
                </span>
                <span>
                  <strong>Description:</strong> {item.description}
                </span>
                {isAdmin ? (
                  <>
                    <span className={`status ${item.status}`}>{item.status}</span>
                    {isActionableStatus(item.status) && (
                      <div className="status-actions">
                        <button
                          type="button"
                          className="status-button accept"
                          onClick={() => handleStatusUpdate(item.id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="status-button reject"
                          onClick={() => handleStatusUpdate(item.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span className={`status ${item.status}`}>{item.status}</span>
                )}
              </div>
            ))}

            {items.length === 0 && !error && <p>No complaints found.</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}



