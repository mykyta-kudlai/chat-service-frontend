import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import ukUA from 'antd/locale/uk_UA';
import { AuthProvider } from './contexts/AuthProvider';
import { SocketProvider } from './contexts/SocketProvider';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

/**
 * Кореневий компонент.
 * Збирає провайдери (Auth → Socket) та налаштовує маршрутизацію.
 * SocketProvider знаходиться всередині AuthProvider, бо залежить від токена.
 */
export default function App() {
  return (
    <ConfigProvider locale={ukUA}>
      {/* antd App: дає контекст для message/notification (без зайвого DOM-вузла) */}
      <AntApp component={false}>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Публічні маршрути — без лейауту */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Захищений маршрут: ProtectedRoute → MainLayout → ChatPage */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ChatPage />} />
                </Route>

                {/* Будь-що інше → чат (а звідти, за потреби, на /login) */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
