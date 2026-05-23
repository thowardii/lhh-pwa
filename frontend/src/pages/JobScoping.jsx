import { useState, useEffect } from 'react';
import { get, post, put } from '../services/api';

export default function JobScoping() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    contactId: '', pipelineId: '', pipelineStageId: '',
    name: '', monetaryValue: '', status: 'open',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    get('/pipelines/')
      .then(data => setPipelines(data.pipelines || []))
      .catch(() => {});
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    try {
      const data = await get('/opportunities/search', {
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
        limit: 20,
      });
      setOpportunities(data.opportunities || []);
    } catch {
      setOpportunities([]);
    }
  }

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

  function editOpp(opp) {
    setEditing(opp.id);
    setForm({
      contactId: opp.contactId || '',
      pipelineId: opp.pipelineId || '',
      pipelineStageId: opp.pipelineStageId || '',
      name: opp.name || '',
      monetaryValue: opp.monetaryValue?.toString() || '',
      status: opp.status || 'open',
    });
    const pl = pipelines.find(p => p.id === opp.pipelineId);
    setSelectedPipeline(pl || null);
  }

  function resetForm() {
    setEditing(null);
    setForm({ contactId: '', pipelineId: '', pipelineStageId: '', name: '', monetaryValue: '', status: 'open' });
    setSelectedPipeline(null);
    setContacts([]);
    setContactQuery('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        ...form,
        locationId: import.meta.env.VITE_GHL_LOCATION_ID,
        monetaryValue: parseFloat(form.monetaryValue) || 0,
      };
      if (editing) {
        await put(`/opportunities/${editing}`, body);
        setMessage({ type: 'success', text: 'Opportunity updated!' });
      } else {
        await post('/opportunities/', body);
        setMessage({ type: 'success', text: 'Job scope created!' });
      }
      resetForm();
      loadOpportunities();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h2>Job Scoping</h2>
      {message && <div className={`toast ${message.type}`}>{message.text}</div>}

      {opportunities.length > 0 && (
        <div className="card">
          <h3>Recent Opportunities</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Pipeline</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(o => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.pipelineName || '-'}</td>
                  <td>${(o.monetaryValue || 0).toLocaleString()}</td>
                  <td>{o.status}</td>
                  <td><button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => editOpp(o)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <h3>{editing ? 'Update Opportunity' : 'Create New Opportunity'}</h3>

        <div className="form-group">
          <label>Job Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>

        <div className="form-group">
          <label>Pipeline</label>
          <select value={form.pipelineId} onChange={e => {
            const pl = pipelines.find(p => p.id === e.target.value);
            setSelectedPipeline(pl);
            setForm(f => ({ ...f, pipelineId: e.target.value, pipelineStageId: '' }));
          }}>
            <option value="">Select pipeline...</option>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {selectedPipeline?.stages?.length > 0 && (
          <div className="form-group">
            <label>Stage</label>
            <select value={form.pipelineStageId} onChange={e => setForm(f => ({ ...f, pipelineStageId: e.target.value }))} required>
              <option value="">Select stage...</option>
              {selectedPipeline.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Value ($)</label>
          <input type="number" step="0.01" value={form.monetaryValue} onChange={e => setForm(f => ({ ...f, monetaryValue: e.target.value }))} />
        </div>

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
            <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}>
              <option value="">Choose...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`} - {c.phone}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Opportunity' : 'Create Opportunity'}
          </button>
          {editing && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
}
