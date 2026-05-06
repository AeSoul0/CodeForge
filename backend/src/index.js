import Fastify from 'fastify';
import cors from '@fastify/cors';

// Inizializza Fastify con il logger attivato per vedere le richieste nel terminale
const fastify = Fastify({
    logger: true
});

// Registra il CORS
await fastify.register(cors, {
    origin: '*' // In futuro qui metterai l'indirizzo esatto del tuo frontend Astro
});

// La tua prima API (Rotta)
fastify.get('/', async (request, reply) => {
    return {
        messaggio: "Il motore Fastify è acceso e ruggisce!",
        status: "Online",
        tecnologia: "Fastify"
    };
});

// Avvia il server sulla porta 3001 (così non va in conflitto con Astro)
const start = async () => {
    try {
        await fastify.listen({ port: 3002 });
        console.log('🚀 Server in ascolto su http://localhost:3002');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();