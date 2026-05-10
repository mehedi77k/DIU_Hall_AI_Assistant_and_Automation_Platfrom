import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

const API_BASE_URL = 'http://localhost:8000'
const QR_READER_ELEMENT_ID = 'gate-security-qr-reader'

function getStoredToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token') || ''
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getStoredToken()}`,
  }
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback

  if (typeof data.detail === 'string') {
    return data.detail
  }

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg).join(', ')
  }

  if (typeof data.message === 'string') {
    return data.message
  }

  return fallback
}

function extractVerificationId(scannedText) {
  const value = scannedText.trim()

  try {
    const url = new URL(value)
    const parts = url.pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] || value
  } catch {
    return value
  }
}

function formatDate(value) {
  if (!value) return 'N/A'

  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function formatDateTime(value) {
  if (!value) return 'N/A'

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function getResultCardClass(status) {
  if (status === 'valid') return 'security-result-card'
  if (status === 'used') return 'security-result-card'
  if (status === 'already_used') return 'security-result-card used'
  return 'security-result-card invalid'
}

function getReadableStatus(status) {
  if (status === 'valid') return 'Valid'
  if (status === 'used') return 'Used Successfully'
  if (status === 'already_used') return 'Already Used'
  if (status === 'invalid') return 'Invalid'
  if (status === 'not_approved') return 'Not Approved'
  return status || 'Unknown'
}

export default function GateSecurityPage() {
  const { verificationId } = useParams()

  const qrScannerRef = useRef(null)
  const hasScannedRef = useRef(false)

  const [manualId, setManualId] = useState('')
  const [activeVerificationId, setActiveVerificationId] = useState('')
  const [result, setResult] = useState(null)

  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')

  const verifyGatePass = useCallback(async (rawVerificationId) => {
    const cleanVerificationId = extractVerificationId(rawVerificationId || '')

    if (!cleanVerificationId) {
      setError('Verification ID is required.')
      return
    }

    setError('')
    setResult(null)
    setLoading(true)
    setActiveVerificationId(cleanVerificationId)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/gate-security/gate-pass/${encodeURIComponent(cleanVerificationId)}`,
        {
          method: 'GET',
          headers: authHeaders(),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Gate pass verification failed.'))
        return
      }

      setResult(data)
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    } finally {
      setLoading(false)
    }
  }, [])

  const stopScanner = useCallback(async () => {
    if (!qrScannerRef.current) {
      setIsScanning(false)
      return
    }

    try {
      const scanner = qrScannerRef.current

      if (scanner.isScanning) {
        await scanner.stop()
      }

      await scanner.clear()
    } catch (err) {
      // Ignore scanner cleanup errors.
    } finally {
      qrScannerRef.current = null
      hasScannedRef.current = false
      setIsScanning(false)

      const scannerElement = document.getElementById(QR_READER_ELEMENT_ID)
      if (scannerElement) {
        scannerElement.innerHTML = ''
      }
    }
  }, [])

  const startScanner = async () => {
    setError('')
    setScannerLoading(true)

    try {
      await stopScanner()

      const scannerElement = document.getElementById(QR_READER_ELEMENT_ID)

      if (!scannerElement) {
        setError('QR scanner area not found.')
        return
      }

      scannerElement.innerHTML = ''
      hasScannedRef.current = false

      const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID)
      qrScannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          if (hasScannedRef.current) {
            return
          }

          hasScannedRef.current = true

          const cleanVerificationId = extractVerificationId(decodedText)

          if (!cleanVerificationId) {
            setError('Invalid QR code.')
            await stopScanner()
            return
          }

          setManualId(cleanVerificationId)
          await verifyGatePass(cleanVerificationId)
          await stopScanner()
        },
        () => {},
      )

      setIsScanning(true)
    } catch (err) {
      setError(
        'Unable to start camera. Please allow camera permission or use manual verification ID.',
      )
      await stopScanner()
    } finally {
      setScannerLoading(false)
    }
  }

  const confirmExit = async () => {
    if (!activeVerificationId) {
      setError('No gate pass selected.')
      return
    }

    setError('')
    setConfirmLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/gate-security/gate-pass/${encodeURIComponent(activeVerificationId)}/use`,
        {
          method: 'POST',
          headers: authHeaders(),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Failed to mark gate pass as used.'))
        return
      }

      setResult(data)
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleManualSubmit = (event) => {
    event.preventDefault()
    verifyGatePass(manualId)
  }

  useEffect(() => {
    if (verificationId) {
      const cleanVerificationId = extractVerificationId(verificationId)

      setManualId(cleanVerificationId)
      verifyGatePass(cleanVerificationId)
    }
  }, [verificationId, verifyGatePass])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const gatePass = result?.gate_pass || null
  const status = result?.status || ''

  return (
    <div>
      <h1>Gate Security Portal</h1>

      <p className="page-lead">
        Scan a gate pass QR code or manually enter the verification ID to verify student exit.
      </p>

      <div className="two-column">
        <div className="card">
          <h2>QR Scanner</h2>

          <p className="page-lead">
            Camera will not start automatically. Click Start Scan when you are ready.
          </p>

          <div className="qr-scanner-box">
            <div id={QR_READER_ELEMENT_ID} />

            {!isScanning && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                Scanner is off.
              </div>
            )}
          </div>

          <div className="security-actions">
            {!isScanning ? (
              <button type="button" onClick={startScanner} disabled={scannerLoading}>
                {scannerLoading ? 'Starting...' : 'Start Scan'}
              </button>
            ) : (
              <button type="button" onClick={stopScanner}>
                Stop Scan
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Manual Verification</h2>

          <form className="form-grid" onSubmit={handleManualSubmit}>
            <input
              type="text"
              placeholder="Enter Verification ID"
              value={manualId}
              onChange={(event) => setManualId(event.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Gate Pass'}
            </button>
          </form>

          {error && (
            <div className="card error-message" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className={`card ${getResultCardClass(status)}`} style={{ marginTop: 20 }}>
          <h2>Verification Result</h2>

          <p>
            <strong>Status:</strong> {getReadableStatus(status)}
          </p>

          <p>
            <strong>Message:</strong> {result.message}
          </p>

          {gatePass && (
            <>
              <div className="security-details-grid">
                <span>
                  <strong>Verification ID:</strong> {gatePass.verification_id}
                </span>

                <span>
                  <strong>Gate Pass No:</strong> GP-{String(gatePass.id).padStart(4, '0')}
                </span>

                <span>
                  <strong>Student Name:</strong> {gatePass.student_name}
                </span>

                <span>
                  <strong>Student ID:</strong> {gatePass.student_id}
                </span>

                <span>
                  <strong>Room No:</strong> {gatePass.room_no}
                </span>

                <span>
                  <strong>Guardian Phone:</strong> {gatePass.guardian_phone}
                </span>

                <span>
                  <strong>Leave Date:</strong> {formatDate(gatePass.leave_date)}
                </span>

                <span>
                  <strong>Return Date:</strong> {formatDate(gatePass.return_date)}
                </span>

                <span>
                  <strong>Reason:</strong> {gatePass.reason}
                </span>

                <span>
                  <strong>Items / Details:</strong> {gatePass.item_list}
                </span>

                <span>
                  <strong>Gate Pass Status:</strong> {gatePass.status}
                </span>

                <span>
                  <strong>Approved By:</strong> {gatePass.approved_by || 'N/A'}
                </span>

                <span>
                  <strong>Used At:</strong> {formatDateTime(gatePass.used_at)}
                </span>

                <span>
                  <strong>Used By Security ID:</strong>{' '}
                  {gatePass.used_by_security_id || 'N/A'}
                </span>
              </div>

              <div className="security-actions">
                {status === 'valid' && (
                  <button type="button" onClick={confirmExit} disabled={confirmLoading}>
                    {confirmLoading ? 'Confirming...' : 'Confirm Exit'}
                  </button>
                )}

                {status === 'already_used' && (
                  <div className="card warning-message">
                    This gate pass has already been used. Do not allow exit using this pass again.
                  </div>
                )}

                {status === 'used' && (
                  <div className="card success-message">
                    Exit confirmed. This gate pass is now marked as used.
                  </div>
                )}

                {gatePass.pdf_path && (
                  <a
                    href={`${API_BASE_URL}${gatePass.pdf_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="nav-item"
                    style={{
                      color: '#0f5132',
                      background: '#e8f2ed',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    Open Gate Pass PDF
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}