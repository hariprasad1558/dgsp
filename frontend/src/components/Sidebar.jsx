import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (e) { }
    navigate('/login');
  };

  const showSidebar =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/model-office-template');

  if (!showSidebar) return null;

  return (
    <aside className="app-sidebar">
      <div className="brand">DGSP Portal</div>

      <nav className="nav-links">
        {!isAdmin && (
          <>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              🏠 Dashboard
            </Link>
            <Link to="/admin/dispatch" className={location.pathname === '/admin/dispatch' ? 'active' : ''}>
              📦 Recommendation Assigned
            </Link>
            <Link to="/model-office-template" className={location.pathname === '/model-office-template' ? 'active' : ''}>
              📄 Model Office Template
            </Link>
            <a href="#" onClick={(e) => e.preventDefault()}>
              👤 Nodal Officer
            </a>
          </>
        )}

        {isAdmin && (
          <>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              🏠 Main Dashboard
            </Link>
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
              📊 Admin Dashboard
            </Link>
            <Link to="/admin/summary" className={location.pathname === '/admin/summary' ? 'active' : ''}>
              📈 Summary Dashboard
            </Link>
            <Link to="/admin/dispatch" className={location.pathname === '/admin/dispatch' ? 'active' : ''}>
              📋 Recommendation Assigned
            </Link>
            <Link to="/admin/users" className={location.pathname === '/admin/users' ? 'active' : ''}>
              👥 User Management
            </Link>
          </>
        )}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button className="logout-sidebar-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
