import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import './styles/index.css';
import { ToastProvider } from './context/ToastContext';
import AdminApp from './pages/admin/AdminApp';

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <HashRouter>
          <AdminApp />
        </HashRouter>
      </ToastProvider>
    </MotionConfig>
  </React.StrictMode>
);
