import { useEffect, useState } from 'react'

const initialForm = {
  room_no: '',
  leave_date: '',
  return_date: '',
  guardian_phone: '',
  reason: '',
  item_list: '',
}

export default function GatePassPage() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null')
  const token = sessionStorage.getItem('token')

  const [form, setForm] = useState(initialForm)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadGatePasses = async () => {
    setError('')

    const response = await fetch('http://localhost:8000/api/v1/gate-passes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to load gate passes')
      return
    }

    setItems(data)
  }

  useEffect(() => {
    loadGatePasses()
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const response = await fetch('http://localhost:8000/api/v1/gate-passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to submit gate pass')
      setLoading(false)
      return
    }

    setSuccess('Gate pass request submitted successfully.')
    setForm(initialForm)
    await loadGatePasses()
    setLoading(false)
  }

  const handleAdminAction = async (gatePassId, action) => {
    setError('')
    setSuccess('')

    const response = await fetch(`http://localhost:8000/api/v1/gate-passes/${gatePassId}/${action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || `Failed to ${action} gate pass`)
      return
    }

    setSuccess(`Gate pass ${action}d successfully.`)
    await loadGatePasses()
  }

  return (
    <div>
      <h1>Gate Pass System</h1>
      <p className="page-lead">
        {user?.role === 'student'
          ? 'Only logged-in students can submit gate pass requests.'
          : 'Administrative users can review, approve, or reject all submitted gate pass requests.'}
      </p>

      <div className="two-column">
        <div className="card">
          {user?.role === 'student' ? (
            <>
              <h3>New Request</h3>

              <div style={{ marginBottom: '14px', color: '#475569' }}>
                <strong>Name:</strong> {user.full_name}
                <br />
                <strong>ID:</strong> {user.student_id}
              </div>

              {!user.signature_image_path && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#fff3cd',
                    color: '#8a6d3b',
                  }}
                >
                  You have not uploaded your signature yet. Admin approval PDF will not be generated until your signature is uploaded from My Profile.
                </div>
              )}

              <form onSubmit={handleSubmit} className="form-grid">
                <input
                  name="room_no"
                  placeholder="Room No"
                  value={form.room_no}
                  onChange={handleChange}
                  required
                />

                <input
                  name="leave_date"
                  type="date"
                  value={form.leave_date}
                  onChange={handleChange}
                  required
                />

                <input
                  name="return_date"
                  type="date"
                  value={form.return_date}
                  onChange={handleChange}
                  required
                />

                <input
                  name="guardian_phone"
                  placeholder="Guardian Phone"
                  value={form.guardian_phone}
                  onChange={handleChange}
                  required
                />

                <input
                  name="reason"
                  placeholder="Reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                />

                <textarea
                  name="item_list"
                  placeholder="Item list or details"
                  value={form.item_list}
                  onChange={handleChange}
                  required
                />

                {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
                {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h3>Administrative Review Panel</h3>
              <p>Administrative users cannot submit gate pass requests.</p>
              <p>You can approve or reject pending requests from the right-side panel.</p>

              {error && <p style={{ color: 'red' }}>{error}</p>}
              {success && <p style={{ color: 'green' }}>{success}</p>}
            </>
          )}
        </div>

        <div className="card">
          <h3>{user?.role === 'admin' ? 'All Gate Pass Requests' : 'My Gate Pass Requests'}</h3>

          <div className="list-wrap">
            {items.map((item) => (
              <div key={item.id} className="list-item">
                <strong>{item.student_name}</strong>
                <span>ID: {item.student_id}</span>
                <span>Room: {item.room_no}</span>
                <span>Leave: {item.leave_date}</span>
                <span>Return: {item.return_date}</span>
                <span>Guardian: {item.guardian_phone}</span>
                <span>Reason: {item.reason}</span>
                <span>Items: {item.item_list}</span>
                <span className={`status ${item.status}`}>{item.status}</span>

                {item.approved_by && <span>Approved by: {item.approved_by}</span>}

                {item.pdf_path && (
                  <a
                    href={`http://localhost:8000${item.pdf_path}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#198754', fontWeight: 700 }}
                  >
                    Open Generated PDF
                  </a>
                )}

                {user?.role === 'admin' && item.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="button" onClick={() => handleAdminAction(item.id, 'approve')}>
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminAction(item.id, 'reject')}
                      style={{ background: '#dc3545' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && !error && <p>No gate pass requests found.</p>}
            {error && user?.role === 'student' && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}



