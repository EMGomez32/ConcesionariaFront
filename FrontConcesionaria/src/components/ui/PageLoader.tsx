import { Car } from 'lucide-react';

const PageLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-accent blur-xl opacity-20 animate-pulse rounded-full"></div>
                <div className="relative w-16 h-16 bg-accent-gradient rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                    <Car size={32} color="#fff" className="animate-bounce" />
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white tracking-widest">DriveSoft</span>
                    <span className="text-xs font-bold text-accent px-2 py-0.5 rounded border border-accent/20 bg-accent/10">OS</span>
                </div>
                <div className="flex gap-1 items-center mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">
                    Inicializando Módulos...
                </p>
            </div>
        </div>
    );
};

export default PageLoader;
