import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../services/api';

export default function AddContact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    address: { line1: '', city: '', state: '', postalCode: '' },
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  function update(field, value) {
    if (field.startsWith('address.')) {
      const key = field.split('.')[1];
      setForm(f => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await post('/contacts/', {
        ...form,
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
      });
      setMessage({ type: 'success', text: 'Contact created!' });
      setTimeout(() => navigate('/contacts'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h2>Add Contact</h2>
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>First Name</label>
          <input value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Street Address</label>
          <input value={form.address.line1} onChange={e => update('address.line1', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>City</label>
            <input value={form.address.city} onChange={e => update('address.city', e.target.value)} />
          </div>
          <div className="form-group">
            <label>State</label>
            <input value={form.address.state} onChange={e => update('address.state', e.target.value)} />
          </div>
          <div className="form-group">
            <label>ZIP</label>
            <input value={form.address.postalCode} onChange={e => update('address.postalCode', e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Create Contact'}
        </button>
      </form>
    </div>
  );
}
