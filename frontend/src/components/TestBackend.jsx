/**
 * @file frontend/src/components/TestBackend.jsx
 * @description A hacker-style terminal widget displaying live backend metrics (Uptime, DB Latency).
 */

import React, { useState, useEffect } from 'react';

export default function TestBackend() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            setError(false);

            // Assumes API_URL is exposed to the frontend (e.g., via Vite/Astro env vars)
            const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/health`);

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch backend metrics:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        // Optional: Refresh metrics every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    // Format uptime from seconds to HH:MM:SS
    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="font-mono text-sm bg-[#0a0a0a] text-cyan-400 p-4 rounded-lg border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] w-full max-w-sm">
            <div className="flex items-center justify-between mb-3 border-b border-cyan-900/50 pb-2">
                <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-slate-500 text-xs tracking-widest">SYSTEM_STATUS</span>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-slate-400">Server:</span>
                    {loading ? (
                        <span className="animate-pulse">pinging...</span>
                    ) : error ? (
                        <span className="text-red-500">OFFLINE</span>
                    ) : (
                        <span className="text-green-400">ONLINE</span>
                    )}
                </div>

                {!loading && !error && metrics && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Uptime:</span>
                            <span>{formatUptime(metrics.uptimeSeconds)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-400">Database:</span>
                            <span className={metrics.database.status === 'connected' ? 'text-green-400' : 'text-red-500'}>
                                {metrics.database.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-400">DB Latency:</span>
                            <span className={metrics.database.latencyMs < 100 ? 'text-green-400' : 'text-yellow-400'}>
                                {metrics.database.latencyMs}ms
                            </span>
                        </div>
                    </>
                )}
            </div>

            <button
                onClick={fetchMetrics}
                disabled={loading}
                className="mt-4 w-full text-xs text-center border border-cyan-800 text-cyan-600 hover:text-cyan-300 hover:border-cyan-500 transition-colors py-1 rounded"
            >
                {loading ? '> executing...' : '> reload_metrics'}
            </button>
        </div>
    );
}