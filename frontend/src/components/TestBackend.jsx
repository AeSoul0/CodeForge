import { useState, useEffect } from 'react';

export default function TestBackend() {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Chiamata al tuo backend Fastify sulla porta 3001
        fetch('http://localhost:3002/')
            .then(response => response.json())
            .then(json => setData(json))
            .catch(err => console.error("Errore connessione backend:", err));
    }, []);

    return (
        <div className="p-4 border-2 border-dashed border-blue-500 rounded-xl mt-10">
            <h2 className="text-xl font-bold">Dati dal Backend:</h2>
            {data ? (
                <pre className="bg-gray-100 p-2 mt-2 rounded">{JSON.stringify(data, null, 2)}</pre>
            ) : (
                <p>Sto caricando i dati dal server Fastify...</p>
            )}
        </div>
    );
}