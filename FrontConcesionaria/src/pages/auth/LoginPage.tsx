import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { LogIn, Key, Mail, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      interface LoginResponse {
        user: {
          id: number;
          nombre: string;
          email: string;
          roles: string[];
          concesionariaId: number | null;
          sucursalId: number | null;
        };
        tokens: { access: string; refresh: string };
      }
      const result = await client.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      // El backend devuelve directamente { user, tokens }, no envuelto en ApiResponse
      const { user, tokens } = result;
      setAuth(user, tokens.access, tokens.refresh);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.error?.message || err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass animate-fade-in">
        <div className="login-header">
          <div className="logo-circle">
            <LogIn size={28} color="#fff" />
          </div>
          <h1>DriveSoft</h1>
          <p>Dealer Management System</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="welcome-text">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="error-message animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label>Contraseña</label>
              <span className="forgot-pass">¿Olvidaste tu contraseña?</span>
            </div>
            <div className="input-wrapper">
              <Key size={18} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="spinner-sm"></div>
                <span>Verificando...</span>
              </div>
            ) : 'Iniciar Sesión'}
          </button>

          <div className="login-footer">
            <p>&copy; 2025 DriveSoft Ecosystem. Todos los derechos reservados.</p>
          </div>
        </form>
      </div>

      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #020617;
          background-image: 
            radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%);
          padding: 1.5rem;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
          border-radius: var(--radius-xl);
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-circle {
          width: 56px;
          height: 56px;
          background: var(--accent-gradient);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 8px 16px rgba(79, 70, 229, 0.4);
        }

        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .welcome-text { margin-bottom: 2rem; }
        .welcome-text h2 { color: white; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
        .welcome-text p { color: #64748b; font-size: 0.9rem; }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .form-group label {
          font-weight: 600;
          font-size: 0.825rem;
          color: #94a3b8;
        }

        .forgot-pass {
            font-size: 0.75rem;
            color: var(--accent);
            cursor: pointer;
            font-weight: 600;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1.125rem;
          color: #475569;
          transition: color 0.2s;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          outline: none;
          transition: all 0.2s;
          background: rgba(30, 41, 59, 0.5);
          color: white;
          font-size: 0.95rem;
        }

        .input-wrapper input:focus {
          border-color: var(--accent);
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
        }

        .input-wrapper input:focus + .input-icon {
            color: var(--accent);
        }

        .login-button {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--accent-gradient);
          color: white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
          transition: all 0.2s;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.4);
        }

        .login-button:active:not(:disabled) {
            transform: translateY(0);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-size: 0.85rem;
        }

        .spinner-sm {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        .login-footer {
            margin-top: 2rem;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 1.5rem;
        }

        .login-footer p {
            font-size: 0.7rem;
            color: #475569;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
