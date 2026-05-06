import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const token = sessionStorage.getItem('token')
  const localUser = JSON.parse(sessionStorage.getItem('user') || 'null')

  const [user, setUser] = useState(localUser)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCurrentUser = async () => {
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      setUser(data)
      sessionStorage.setItem('user', JSON.stringify(data))
    }
  }

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const handleUpload = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedFile) {
      setError('Please choose a signature image first.')
      return
    }

    const formData = new FormData()
    formData.append('signature', selectedFile)

    const response = await fetch('http://localhost:8000/api/v1/users/me/signature', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || 'Failed to upload signature')
      return
    }

    setUser(data)
    sessionStorage.setItem('user', JSON.stringify(data))
    setSelectedFile(null)
    setSuccess('Signature uploaded successfully.')
  }

  return (
    <div>
      <h1>My Profile</h1>
      <p className="page-lead">
        Upload your signature here. Gate pass approval PDF needs the student signature.
      </p>

      <div className="two-column">
        <div className="card">
          <h3>Account Information</h3>

          <div className="list-wrap">
            <div className="list-item">
              <strong>{user?.full_name}</strong>
              <span>ID: {user?.student_id}</span>
              <span>Email: {user?.email}</span>
              <span>Phone: {user?.phone || 'Not added'}</span>
              <span>Role: {user?.role === 'admin' ? 'Administrative' : 'Student'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Signature Upload</h3>

          <form onSubmit={handleUpload} className="form-grid">
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />

            {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
            {success && <p style={{ color: 'green', margin: 0 }}>{success}</p>}

            <button type="submit">Upload Signature</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Current Signature</h4>

            {user?.signature_image_path ? (
              <img
                src={`http://localhost:8000${user.signature_image_path}`}
                alt="User signature"
                style={{
                  maxWidth: '100%',
                  height: '120px',
                  objectFit: 'contain',
                  border: '1px solid #dbe4dd',
                  borderRadius: '12px',
                  padding: '10px',
                  background: '#fff',
                }}
              />
            ) : (
              <p style={{ color: '#64748b' }}>No signature uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



