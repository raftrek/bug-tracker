import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProjectsDashboard from './pages/ProjectsDashboard';
import NewProject from './pages/NewProject';
import ProjectBoardPage from './pages/ProjectBoard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<ProjectsDashboard />} />
      <Route path="/projects/new" element={<NewProject />} />
      <Route path="/board/:projectId" element={<ProjectBoardPage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

export default App;