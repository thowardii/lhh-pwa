import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContactLookup from './pages/ContactLookup';
import AddContact from './pages/AddContact';
import JobScoping from './pages/JobScoping';
import SendInvoice from './pages/SendInvoice';
import PaymentLink from './pages/PaymentLink';
import PhotoCapture from './pages/PhotoCapture';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<ContactLookup />} />
        <Route path="/contacts/new" element={<AddContact />} />
        <Route path="/scoping" element={<JobScoping />} />
        <Route path="/invoices" element={<SendInvoice />} />
        <Route path="/payments" element={<PaymentLink />} />
        <Route path="/photos" element={<PhotoCapture />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
