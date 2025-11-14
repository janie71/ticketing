import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/user/HomePage';
import ReservationPage from './pages/user/ReservationPage';
import SchedulePage from './pages/user/SchedulePage';
import AdminPage from './pages/admin/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 일반 유저 페이지 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          
          {/* 관리자 페이지 */}
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;