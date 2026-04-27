import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthShell from './AuthShell';
import { accountApi } from '../../api/account.api';
import { getApiErrorMessage } from '../../utils/error';

const RecuperarPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await accountApi.requestReset({ email });
            setDone(true); // Siempre éxito (mensaje genérico — backend nunca confirma si el email existe)
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo procesar la solicitud.'));
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <AuthShell title="Revisá tu email" subtitle="Te enviamos las instrucciones si tu cuenta existe.">
                <div className="auth-alert auth-alert--ok">
                    <CheckCircle2 size={16} />
                    <span>
                        Si <strong>{email}</strong> está registrado en el sistema, vas a recibir un email
                        con un link para restablecer tu contraseña. El link es válido por 60 minutos.
                    </span>
                </div>
                <Link to="/login" className="btn btn-secondary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    Volver al login
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="¿Olvidaste tu contraseña?"
            subtitle="Ingresá tu email y te enviamos un link para crear una nueva."
            footer={<>¿Te acordaste? <Link to="/login">Iniciar sesión</Link></>}
        >
            {error && (
                <div className="auth-alert auth-alert--err" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                    <label htmlFor="email" className="input-label">Correo electrónico</label>
                    <div className="input-container has-icon">
                        <span className="input-icon"><Mail size={16} /></span>
                        <input
                            id="email"
                            type="email"
                            className="input-control"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading || !email}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                >
                    {loading ? 'Enviando…' : 'Enviarme el link'}
                </button>
            </form>
        </AuthShell>
    );
};

export default RecuperarPasswordPage;
