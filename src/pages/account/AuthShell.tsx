import type { ReactNode } from 'react';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
}

/**
 * Shell visual reusable para páginas de auth/account: login, activar cuenta,
 * recuperar password, restablecer password. Mismo background que LoginPage.
 */
const AuthShell = ({ title, subtitle, children, footer }: Props) => {
    return (
        <div className="auth-stage">
            <div className="auth-stage-grid" aria-hidden="true" />
            <div className="auth-stage-orb auth-stage-orb--violet" aria-hidden="true" />
            <div className="auth-stage-orb auth-stage-orb--cyan" aria-hidden="true" />
            <div className="auth-stage-orb auth-stage-orb--emerald" aria-hidden="true" />

            <main className="auth-card animate-scale-in" role="main">
                <header className="auth-header">
                    <Link to="/login" className="auth-logo" aria-label="Volver a inicio">
                        <Car size={26} color="#ffffff" />
                    </Link>
                    <h1 className="auth-brand">AUTENZA</h1>
                    <p className="auth-tag">Dealer Operating System</p>
                </header>

                <div className="auth-welcome">
                    <h2>{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                {children}

                {footer && <footer className="auth-footer">{footer}</footer>}
            </main>

            <style>{`
                .auth-stage {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 1.5rem;
                    background: #04060d;
                    overflow: hidden;
                    isolation: isolate;
                }
                .auth-stage-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
                    background-size: 56px 56px;
                    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
                    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
                    z-index: 0;
                }
                .auth-stage-orb {
                    position: absolute; border-radius: 50%;
                    filter: blur(80px); z-index: 0;
                    animation: orb-drift 14s ease-in-out infinite;
                }
                .auth-stage-orb--violet { width:480px; height:480px; background:rgba(139,92,246,0.45); top:-120px; left:-80px; }
                .auth-stage-orb--cyan { width:420px; height:420px; background:rgba(6,182,212,0.35); bottom:-120px; right:-80px; animation-delay:-4s; }
                .auth-stage-orb--emerald {
                    width:360px; height:360px; background:rgba(16,185,129,0.30);
                    top:50%; left:50%; transform:translate(-50%,-50%); animation-delay:-7s;
                    animation-name: orb-drift-center;
                }
                @keyframes orb-drift {
                    0%,100%{transform:translate(0,0) scale(1)}
                    33%{transform:translate(40px,-30px) scale(1.05)}
                    66%{transform:translate(-20px,40px) scale(0.95)}
                }
                @keyframes orb-drift-center {
                    0%,100%{transform:translate(-50%,-50%) scale(1)}
                    50%{transform:translate(-50%,-50%) scale(1.15)}
                }
                .auth-card {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 460px; padding: 2.5rem;
                    border-radius: var(--radius-xl);
                    background: rgba(13,18,33,0.72);
                    backdrop-filter: blur(24px) saturate(160%);
                    -webkit-backdrop-filter: blur(24px) saturate(160%);
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 30px 60px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
                    color: #f5f7fb;
                }
                .auth-card::before {
                    content:''; position:absolute; inset:-1px; border-radius:inherit; padding:1px;
                    background: linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(16,185,129,0) 40%, rgba(6,182,212,0.5) 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
                }
                .auth-header { text-align: center; margin-bottom: 1.5rem; }
                .auth-logo {
                    width: 56px; height: 56px; margin: 0 auto 1rem;
                    border-radius: var(--radius-lg);
                    background: var(--neon-gradient);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.15) inset, 0 12px 32px -6px rgba(139,92,246,0.55);
                    text-decoration: none;
                }
                .auth-brand {
                    font-family: var(--font-display);
                    font-size: 1.6rem; font-weight: 700; letter-spacing: 0.18em;
                    margin: 0 0 0.25rem;
                    background: var(--neon-gradient); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
                }
                .auth-tag {
                    font-family: var(--font-sans);
                    font-size: 0.7rem; color: rgba(255,255,255,0.45); font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.18em;
                }
                .auth-welcome { margin-bottom: 1.25rem; text-align: center; }
                .auth-welcome h2 {
                    font-family: var(--font-display);
                    font-size: 1.25rem; font-weight: 600; margin: 0 0 0.4rem; color: #fff;
                }
                .auth-welcome p { color: rgba(255,255,255,0.55); font-size: var(--text-sm); margin: 0; }
                .auth-footer {
                    margin-top: 1.5rem; text-align: center; padding-top: 1.25rem;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    font-size: 0.8rem; color: rgba(255,255,255,0.55);
                }
                .auth-footer a { color: var(--accent-2); text-decoration: none; }
                .auth-footer a:hover { text-decoration: underline; }

                /* Inputs sobre fondo dark */
                .auth-card .input-label { color: rgba(255,255,255,0.7); }
                .auth-card .input-control {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.10);
                    color: #fff;
                }
                .auth-card .input-control:hover:not(:focus) { border-color: rgba(255,255,255,0.18); }
                .auth-card .input-control:focus {
                    background: rgba(255,255,255,0.06);
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.25);
                }
                .auth-card .input-control::placeholder { color: rgba(255,255,255,0.3); }
                .auth-card .input-icon { color: rgba(255,255,255,0.4); }
                .auth-card .input-container:focus-within .input-icon { color: var(--accent); }
                .auth-card .input-reveal { color: rgba(255,255,255,0.5); }
                .auth-card .input-reveal:hover { color: #fff; background: rgba(255,255,255,0.06); }

                .auth-alert {
                    display:flex; align-items:flex-start; gap:.625rem;
                    padding:.75rem 1rem; border-radius: var(--radius-md);
                    font-size: var(--text-sm); margin-bottom: 1rem;
                }
                .auth-alert--err { background: rgba(239,68,68,0.10); color: #fecaca; border: 1px solid rgba(239,68,68,0.25); }
                .auth-alert--ok  { background: rgba(34,197,94,0.10); color: #bbf7d0; border: 1px solid rgba(34,197,94,0.25); }
                .auth-alert--info{ background: rgba(6,182,212,0.10); color: #bef0fb; border: 1px solid rgba(6,182,212,0.25); }
            `}</style>
        </div>
    );
};

export default AuthShell;
