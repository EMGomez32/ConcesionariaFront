import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Key, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell from './AuthShell';
import { accountApi } from '../../api/account.api';
import { getApiErrorMessage } from '../../utils/error';

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const ActivarCuentaPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) setError('El link es inválido. Pedile a un administrador que te reenvíe la invitación.');
    }, [token]);

    const pwdStrength = useMemo(() => {
        if (!password) return null;
        if (!PWD_REGEX.test(password)) return { ok: false, msg: 'Mín. 8 caracteres, una mayúscula, una minúscula y un número.' };
        if (password !== confirm && confirm.length > 0) return { ok: false, msg: 'Las contraseñas no coinciden.' };
        return { ok: true, msg: 'Contraseña válida.' };
    }, [password, confirm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!PWD_REGEX.test(password)) {
            setError('La contraseña no cumple los requisitos mínimos.');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        setLoading(true);
        try {
            await accountApi.activate({ token, password });
            setDone(true);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo activar la cuenta.'));
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <AuthShell title="Cuenta activada" subtitle="Ya podés iniciar sesión.">
                <div className="auth-alert auth-alert--ok">
                    <CheckCircle2 size={16} />
                    <span>Tu contraseña fue creada y tu cuenta quedó activa. Te llevamos al login…</span>
                </div>
                <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    Ir a iniciar sesión
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Activá tu cuenta"
            subtitle="Creá tu contraseña para terminar de configurar el acceso."
            footer={<>¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link></>}
        >
            {error && (
                <div className="auth-alert auth-alert--err" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                    <label htmlFor="pwd" className="input-label">Nueva contraseña</label>
                    <div className="input-container has-icon">
                        <span className="input-icon"><Key size={16} /></span>
                        <input
                            id="pwd"
                            type={showPwd ? 'text' : 'password'}
                            className="input-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            disabled={!token || loading}
                        />
                        <button
                            type="button"
                            className="input-reveal"
                            onClick={() => setShowPwd(p => !p)}
                            tabIndex={-1}
                            aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
                        >
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="pwd2" className="input-label">Repetí la contraseña</label>
                    <div className="input-container has-icon">
                        <span className="input-icon"><Key size={16} /></span>
                        <input
                            id="pwd2"
                            type={showPwd ? 'text' : 'password'}
                            className="input-control"
                            placeholder="••••••••"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            disabled={!token || loading}
                        />
                    </div>
                </div>

                {pwdStrength && (
                    <p style={{
                        fontSize: '0.75rem',
                        color: pwdStrength.ok ? 'rgba(187, 247, 208, 0.85)' : 'rgba(254, 202, 202, 0.85)',
                        margin: 0,
                    }}>
                        {pwdStrength.msg}
                    </p>
                )}

                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading || !token || !pwdStrength?.ok}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                >
                    {loading ? 'Activando…' : 'Activar mi cuenta'}
                </button>
            </form>
        </AuthShell>
    );
};

export default ActivarCuentaPage;
