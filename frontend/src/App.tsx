import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageResourcesPage from './pages/ManageResourcesPage';
import BookingPage from './pages/BookingPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import RequestCreditsPage from './pages/RequestCreditsPage';

// Import components
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
    >
      Logout
    </button>
  );
};


const App: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <Link to="/" className="text-2xl font-bold text-blue-600">Makerspace</Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link to="/" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                  
                  {user ? (
                    <>
                      <Link to="/bookings" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Book a Resource</Link>
                      
                      {!isAdmin && (
                        <Link to="/request-credits" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                          Request Credits
                        </Link>
                      )}

                      {isAdmin && (
                        <>
                          <Link to="/admin/dashboard" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                            Dashboard
                          </Link>
                          <Link to="/admin/resources" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                            Resources
                          </Link>
                        </>
                      )}

                      <span className="text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                        Welcome, {user.name || user.email}!
                        {isAdmin ? ' (Admin)' : ` (${user.creditBalance} credits)`}
                      </span>
                      <LogoutButton />
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                      <Link to="/register" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Register</Link>
                      <Link to="/register/admin" className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Request Admin</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/admin" element={<AdminRegisterPage />} />

              {/* Protected Member Routes */}
              <Route path="/" element={<ProtectedRoute />}>
                <Route path="bookings" element={<BookingPage />} />
                <Route path="book/:resourceId" element={<ResourceDetailPage />} />
                <Route path="request-credits" element={<RequestCreditsPage />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminRoute />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="resources" element={<ManageResourcesPage />} />
              </Route>
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;