import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InvitationPage from './pages/InvitationPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitationPage />} />
        <Route path="/admin" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
