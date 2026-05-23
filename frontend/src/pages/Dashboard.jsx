import { useState, useEffect } from 'react';
import { get } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    get('/calendars/events', {
      locationId: import.meta.env.VITE_GHL_LOCATION_ID || '',
      startTime: today.toISOString(),
      endTime: new Date(today.getTime() + 7 * 86400000).toISOString(),
    })
      .then(data => {
        const events = data.events || [];
        setAppointments(events);
        setTodayCount(events.filter(e => {
          const d = new Date(e.startTime);
          return d.toDateString() === today.toDateString();
        }).length);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <p style={{ color: 'var(--gray-500)', marginBottom: 20, fontSize: 15 }}>{dateStr}</p>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-value">{appointments.length}</div>
          <div className="stat-label">Upcoming (7 days)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{todayCount}</div>
          <div className="stat-label">Today's Appointments</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/invoices')}>
          <div className="stat-value">0</div>
          <div className="stat-label">Pending Invoices</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/scoping')}>📋 New Job Scope</button>
          <button className="btn btn-primary" onClick={() => navigate('/contacts/new')}>➕ New Contact</button>
          <button className="btn btn-primary" onClick={() => navigate('/photos')}>📷 Take Photo</button>
          <button className="btn btn-primary" onClick={() => navigate('/invoices')}>🧾 New Invoice</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Upcoming Appointments</h3>
        {loading ? (
          <div className="loading">Loading</div>
        ) : error ? (
          <div className="empty-state">
            <p>Could not load appointments</p>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 8 }}>📅</p>
            <p>No upcoming appointments this week</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Contact</th>
                <th>Title</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt, i) => (
                <tr key={appt.id || i}>
                  <td>{new Date(appt.startTime).toLocaleDateString()}</td>
                  <td>{new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{appt.contactName || '-'}</td>
                  <td>{appt.title}</td>
                  <td>{appt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
