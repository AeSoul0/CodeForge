import { useState, useEffect } from 'react';

export default function TestBackend() {
    const [healthData, setHealthData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Dynamic URL
        const apiUrl = import.meta.env.PUBLIC_API_URL || "http://localhost:3002";

        // Api/Health check on backend
        fetch(`${apiUrl}/api/health`)
            .then(response => {
                if (!response.ok) throw new Error("Backend non raggiungibile");
                return response.json();
            })
            .then(json => setHealthData(json))
            .catch(err => {
                console.error("Errore fetch: ", err);
                setError(true);
            });
    }, []);

    return (
        <div className="p-6 mt-8 border border-slate-700 rounded-xl bg-slate-800/50 backdrop-blur-sm w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Stato del Sistema: </h2>

            {error ? (
                <div className="flex items-center gap-3 text-red-400">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <p>Errore di connessione al Backend</p>
                </div>
            ) : healthData ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">API Status: </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${healthData.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {healthData.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Database: </span>
                        <span className="text-white font-medium">{healthData.database}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Uptime: </span>
                        <span className="text-white text-sm">{Math.round(healthData.uptime)} secondi</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 text-emerald-400">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    <p>Verifica dei sistemi in corso...</p>
                </div>
            )}
        </div>
    );
}