import { useState } from 'react';
import { get, post } from '../services/api';

export default function SendInvoice() {
  const [contactQuery, setContactQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState('');
  const [sendMethod, setSendMethod] = useState('email');
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  async function loadRecent() {
    try {
      const data = await get('/invoices/', { locationId: import.meta.env.VITE_GHL_LOCATION_ID, limit: 10 });
      setRecentInvoices(data.invoices || []);
      setShowRecent(true);
    } catch {
      setRecentInvoices([]);
    }
  }

  function addItem() {
    setItems(i => [...i, { name: '', quantity: 1, price: 0 }]);
  }

  function removeItem(idx) {
    setItems(i => i.filter((_, n) => n !== idx));
  }

  function updateItem(idx, field, value) {
    setItems(i => i.map((item, n) => n === idx ? { ...item, [field]: value } : item));
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contactId) return;
    setSaving(true);
    setMessage(null);
    try {
      const invoice = await post('/invoices/', {
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
        contactId,
        title: 'Job Invoice',
        invoiceNumber: `INV-${Date.now()}`,
        currency: 'USD',
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          amount: item.quantity * item.price,
        })),
        total,
      });

      if (sendMethod === 'email') {
        await post(`/invoices/${invoice.id}/send`, { sendType: 'email', contactId });
      } else {
        const contact = contacts.find(c => c.id === contactId);
        const phone = contact?.phone;
        if (phone) {
          await post('/conversations/', {
            locationId: import.meta.env.VITE_GHL_LOCATION_ID,
            contactId,
            type: 'SMS',
            body: `Invoice from L&H Home Solutions: $${total.toFixed(2)}. View here: ${invoice.invoiceUrl || ''}`,
          });
        }
      }

      setMessage({ type: 'success', text: `Invoice created and sent via ${sendMethod}!` });
      setItems([{ name: '', quantity: 1, price: 0 }]);
      loadRecent();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h2>Send Invoice</h2>
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="card">
        <h3>Invoice Details</h3>

        <div className="form-group">
          <label>Find Contact</label>
          <div className="search-bar">
            <input placeholder="Search contact..." value={contactQuery} onChange={e => setContactQuery(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={searchContacts}>Search</button>
          </div>
        </div>

        {contacts.length > 0 && (
          <div className="form-group">
            <label>Select Contact</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)} required>
              <option value="">Choose...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`} - {c.phone || c.email}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Send Method</label>
          <select value={sendMethod} onChange={e => setSendMethod(e.target.value)}>
            <option value="email">Email</option>
            <option value="sms">SMS (Text)</option>
          </select>
        </div>

        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
              <label>Item</label>
              <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 0.4, marginBottom: 0 }}>
              <label>Qty</label>
              <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group" style={{ flex: 0.4, marginBottom: 0 }}>
              <label>Price</label>
              <input type="number" step="0.01" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
            </div>
            {items.length > 1 && (
              <button type="button" className="btn btn-danger" style={{ padding: '4px 10px', marginBottom: 0, fontSize: 14 }} onClick={() => removeItem(idx)}>✕</button>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Add Item</button>
          <strong style={{ fontSize: 18 }}>Total: ${total.toFixed(2)}</strong>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving || !contactId}>
          {saving ? 'Creating & Sending...' : `Create & Send via ${sendMethod === 'email' ? 'Email' : 'SMS'}`}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={loadRecent}>
          {showRecent ? 'Refresh Recent Invoices' : 'View Recent Invoices'}
        </button>
      </div>

      {showRecent && recentInvoices.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Recent Invoices</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Contact</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.contactName || '-'}</td>
                  <td>${(inv.total || 0).toFixed(2)}</td>
                  <td>{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
