import { useState } from 'react';
import { get, post, put } from '../services/api';

export default function ContactLookup() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSelected(null);
    try {
      const data = await post('/contacts/search', {
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
        query: query.trim(),
      });
      setContacts(data.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectContact(id) {
    setLoading(true);
    setEditMode(false);
    try {
      const data = await get(`/contacts/${id}`);
      setSelected(data.contact);
      setEditForm(data.contact);
    } catch {
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    setLoading(true);
    setMessage(null);
    try {
      await put(`/contacts/${selected.id}`, {
        ...editForm,
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
      });
      setMessage({ type: 'success', text: 'Contact updated!' });
      setSelected(editForm);
      setEditMode(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpsert() {
    setLoading(true);
    setMessage(null);
    try {
      const data = await post('/contacts/upsert', {
        ...editForm,
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
      });
      setMessage({ type: 'success', text: 'Contact upserted!' });
      setSelected(data.contact);
      setEditForm(data.contact);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function addTag() {
    if (!newTag.trim() || !selected) return;
    setLoading(true);
    try {
      await post(`/contacts/${selected.id}/tags`, { tags: [newTag.trim()] });
      setSelected(s => ({ ...s, tags: [...(s.tags || []), newTag.trim()] }));
      setNewTag('');
      setMessage({ type: 'success', text: `Tag "${newTag.trim()}" added` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setEditForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div className="page">
      <h2>Contact Lookup</h2>
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}

      <div className="search-bar">
        <input
          placeholder="Search by name, phone, or email..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        <button className="btn btn-secondary" onClick={() => window.location.href = '/contacts/new'}>+ New</button>
      </div>

      {loading && <div className="loading">Loading</div>}

      {!loading && contacts.length > 0 && (
        <div className="card">
          <h3>Results</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} onClick={() => selectContact(c.id)} style={{ cursor: 'pointer' }}>
                  <td>{c.name || `${c.firstName || ''} ${c.lastName || ''}`}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td><button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 13 }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && contacts.length === 0 && query && (
        <div className="empty-state"><p>No contacts found</p></div>
      )}

      {selected && !editMode && (
        <div className="card">
          <h3>Contact Details</h3>
          <p><strong>Name:</strong> {selected.name || `${selected.firstName || ''} ${selected.lastName || ''}`}</p>
          <p><strong>Phone:</strong> {selected.phone || '-'}</p>
          <p><strong>Email:</strong> {selected.email || '-'}</p>
          <p><strong>Address:</strong> {selected.address?.line1 ? `${selected.address.line1}, ${selected.city || ''} ${selected.state || ''}` : '-'}</p>
          {selected.tags?.length > 0 && (
            <p><strong>Tags:</strong> {selected.tags.join(', ')}</p>
          )}
          {selected.customFields?.length > 0 && (
            <>
              <p><strong>Custom Fields:</strong></p>
              <ul style={{ marginLeft: 20, marginBottom: 12 }}>
                {selected.customFields.map((f, i) => (
                  <li key={i}>{f.name}: {f.value}</li>
                ))}
              </ul>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit</button>
          </div>
        </div>
      )}

      {selected && editMode && (
        <div className="card">
          <h3>Edit Contact</h3>
          <div className="form-group"><label>First Name</label><input value={editForm.firstName || ''} onChange={e => updateField('firstName', e.target.value)} /></div>
          <div className="form-group"><label>Last Name</label><input value={editForm.lastName || ''} onChange={e => updateField('lastName', e.target.value)} /></div>
          <div className="form-group"><label>Phone</label><input value={editForm.phone || ''} onChange={e => updateField('phone', e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input value={editForm.email || ''} onChange={e => updateField('email', e.target.value)} /></div>
          <div className="form-group"><label>Address</label><input value={editForm.address?.line1 || ''} onChange={e => updateField('address', { ...editForm.address, line1: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>Update</button>
            <button className="btn btn-success" onClick={handleUpsert} disabled={loading}>Upsert (create or update)</button>
            <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="card">
          <h3>Manage Tags</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="New tag name..." onKeyDown={e => e.key === 'Enter' && addTag()} />
            <button className="btn btn-primary" onClick={addTag} disabled={loading || !newTag.trim()}>Add Tag</button>
          </div>
        </div>
      )}
    </div>
  );
}
