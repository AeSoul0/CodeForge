import 'dotenv/config'; // Carica le variabili segrete dal file .env (come l'URL del DB)
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.js';
import projectRoutes from './routes/projectRoutes.js'; // Assicurati che la 'R' sia maiuscola!

// Inizializziamo Fastify con la configurazione del logger che abbiamo scelto insieme
const fastify = Fastify({
    logger: {
        level: 'info', // Mostra i log informativi di base
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'SYS:HH:mm:ss', // Ora locale dell'Italia
                ignore: 'pid,hostname,reqId',           // Pulizia per non affaticare la vista
                colorize: true,                         // Colori attivi nel terminale
                singleLine: true,                       // Tutto su una riga per ordine
            }
        }
    }
});

// Abilitiamo il CORS: permette al frontend (localhost:2003) di parlare con il backend (3002)
await fastify.register(cors, { origin: '*' });

// Registriamo le rotte dei progetti (il "ponte" creato poco fa)
fastify.register(projectRoutes);

// Registriamo la rotta di salute con un prefisso (es: /api/health)
fastify.register(healthRoutes, { prefix: '/api' });

// Funzione principale di avvio
const start = async () => {
    try {
        // 1. Prima di tutto, proviamo a connetterci a MongoDB Cloud
        await connectDB();

        // 2. Se il DB risponde, allora apriamo la porta 3002 per ricevere visite
        const PORT = process.env.PORT || 3002;
        await fastify.listen({ port: PORT, host: '0.0.0.0' });

        // Messaggio di conferma finale nel terminale
        console.log('🚀 Server pronto e database sincronizzato! Vai su http://localhost:3002\n');

    } catch (err) {
        // Se c'è un errore critico (es: password DB sbagliata), fermiamo tutto
        console.error('❌ Impossibile avviare il server :');
        fastify.log.error(err);
        process.exit(1); // Spegne il processo Node.js
    }
};

// Eseguiamo la funzione di avvio
start();