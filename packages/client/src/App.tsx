import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FolderProvider } from './contexts/FolderContext';
import { PromptProvider } from './contexts/PromptContext';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    }

    return isAuthenticated ? (
        <FolderProvider>
            <PromptProvider>
                <Outlet />
            </PromptProvider>
        </FolderProvider>
    ) : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
            </Route>
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <ThemeProvider>
                        <AppRoutes />
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
};

export default App;