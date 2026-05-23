import { useState, useEffect } from 'react';
import { get, post } from '../services/api';

export default function PaymentLink() {
  const [contactQuery, setContactQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    get('/payments/transactions', { locationId: import.meta.env.VITE_GHL_LOCATION_ID, limit: 10 })
      .then(data => setRecentTransactions(data.transactions || []))
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contactId || !amount) return;
    setSaving(true);
    setMessage(null);
    try {
      const invoice = await post('/invoices/', {
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
        contactId,
        title: description || 'Payment',
        invoiceNumber: `PYMT-${Date.now()}`,
        currency: 'USD',
        items: [{ name: description || 'Payment', quantity: 1, price: parseFloat(amount) }],
        total: parseFloat(amount),
      });

      const contact = contacts.find(c => c.id === contactId);
      const phone = contact?.phone;
      if (phone) {
        await post('/conversations/', {
          locationId: import.meta.env.VITE_GHL_LOCATION_ID,
          contactId,
          type: 'SMS',
          body: `Payment request from L&H Home Solutions: $${parseFloat(amount).toFixed(2)}. Pay here: ${invoice.invoiceUrl || invoice.id}`,
        });
      }

      setMessage({ type: 'success', text: 'Payment link sent via SMS!' });
      setAmount('');
      setDescription('');
      get('/payments/transactions', { locationId: import.meta.env.VITE_GHL_LOCATION_ID, limit: 10 })
        .then(data => setRecentTransactions(data.transactions || []))
        .catch(() => {});
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h2>Send Payment Link</h2>
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="card">
        <h3>Payment Details</h3>

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
                <option key={c.id} value={c.id}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`} - {c.phone}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Amount ($)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Roof repair - balance due" />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving || !contactId || !amount}>
          {saving ? 'Sending...' : 'Create Invoice & Send SMS'}
        </button>
      </form>

      {recentTransactions.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Recent Transactions</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Contact</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}</td>
                  <td>{tx.contactName || '-'}</td>
                  <td>${(tx.amount || 0).toFixed(2)}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
