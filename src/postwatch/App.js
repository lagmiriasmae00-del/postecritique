import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import OperatorList from './components/OperatorList';
import AbsenceDashboard from './components/AbsenceDashboard';
import PostStatus from './components/PostStatus';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header onLogout={() => setIsLoggedIn(false)} />
        <main className="container mx-auto px-4 py-8 mt-16">
          <Routes>
            <Route path="/operators" element={<OperatorList />} />
            <Route path="/absences" element={<AbsenceDashboard />} />
            <Route path="/status" element={<PostStatus />} />
            <Route path="*" element={<Navigate to="/status" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;