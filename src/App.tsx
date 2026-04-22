import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import PublicHome from './pages/PublicHome';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
