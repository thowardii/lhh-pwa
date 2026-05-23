import { useState, useRef, useEffect } from 'react';
import { get, post } from '../services/api';

export default function PhotoCapture() {
  const [contactQuery, setContactQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    get('/media/', { locationId: import.meta.env.VITE_GHL_LOCATION_ID, limit: 12 })
      .then(data => setRecentPhotos(data.media || []))
      .catch(() => {});
  }, []);

  async function searchContacts() {
    if (!contactQuery.trim()) return;
    try {
      const data = await post('/contacts/search', {
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
        query: contactQuery.trim(),
      });
      setContacts(data.contacts || []);
    } catch {
      setContacts([]);
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setPhotoBlob(file);
  }

  function retake() {
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(null);
    setPhotoBlob(null);
  }

  async function handleUpload() {
    if (!photoBlob || !contactId) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', photoBlob);
      formData.append('locationId', import.meta.env.VITE_GHL_LOCATION_ID);
      formData.append('contactId', contactId);
      formData.append('title', `Job Photo - ${new Date().toLocaleDateString()}`);

      const res = await fetch('/api/ghl/media/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMessage({ type: 'success', text: 'Photo uploaded to GHL!' });
      retake();
      get('/media/', { locationId: import.meta.env.VITE_GHL_LOCATION_ID, limit: 12 })
        .then(d => setRecentPhotos(d.media || []))
        .catch(() => {});
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  }

  async function uploadWithoutContact() {
    if (!photoBlob) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', photoBlob);
      formData.append('locationId', import.meta.env.VITE_GHL_LOCATION_ID);
      formData.append('title', `Job Photo - ${new Date().toLocaleDateString()}`);

      const res = await fetch('/api/ghl/media/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMessage({ type: 'success', text: 'Photo uploaded without contact link!' });
      retake();
      get('/media/', { locationId: import.meta.env.VITE_GHL_LOCATION_ID, limit: 12 })
        .then(d => setRecentPhotos(d.media || []))
        .catch(() => {});
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page">
      <h2>Photo Capture</h2>
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}

      <div className="card">
        <h3>Capture Job Site Photo</h3>
        <div className="camera-container">
          {photo ? (
            <img src={photo} alt="Job site preview" />
          ) : (
            <div style={{ width: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', borderRadius: 12, color: 'var(--gray-500)' }}>
              No photo captured
            </div>
          )}

          <div className="camera-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              📷 {photo ? 'Retake Photo' : 'Take Photo'}
            </button>
            {photo && <button className="btn btn-secondary" onClick={retake}>Clear</button>}
          </div>

          {photo && (
            <>
              <div className="form-group" style={{ width: '100%' }}>
                <label>Link to Contact (optional)</label>
                <div className="search-bar">
                  <input placeholder="Search contact..." value={contactQuery} onChange={e => setContactQuery(e.target.value)} />
                  <button type="button" className="btn btn-secondary" onClick={searchContacts}>Search</button>
                </div>
              </div>

              {contacts.length > 0 && (
                <div className="form-group" style={{ width: '100%' }}>
                  <select value={contactId} onChange={e => setContactId(e.target.value)}>
                    <option value="">Choose...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-success" onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload to GHL'}
                </button>
                <button className="btn btn-secondary" onClick={uploadWithoutContact} disabled={uploading}>
                  Upload without Contact Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {recentPhotos.length > 0 && (
        <div className="card">
          <h3>Recent Photos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {recentPhotos.map(m => (
              <div key={m.id} style={{ borderRadius: 8, overflow: 'hidden', background: 'var(--gray-100)' }}>
                {m.url && <img src={m.url} alt={m.title || 'Photo'} style={{ width: '100%', height: 100, objectFit: 'cover' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
