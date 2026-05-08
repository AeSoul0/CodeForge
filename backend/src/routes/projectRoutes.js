// Importiamo il modello che abbiamo appena creato per parlare con MongoDB
import Project from '../models/Projects.js';

export default async function projectRoutes(fastify, options) {

    // ROTTA GET: Serve per leggere tutti i progetti dal DB
    // URL: http://localhost:3002/api/projects
    fastify.get('/api/projects', async (request, reply) => {
        try {
            // .find() senza filtri restituisce TUTTI i documenti della collezione
            const projects = await Project.find();
            return projects;
        } catch (err) {
            // Se qualcosa va storto, logghiamo l'errore e avvisiamo l'utente
            fastify.log.error(err);
            reply.status(500).send({ error: 'Impossibile recuperare i progetti' });
        }
    });

    // ROTTA POST: Serve per salvare un nuovo progetto nel DB
    // URL: http://localhost:3002/api/projects
    fastify.post('/api/projects', async (request, reply) => {
        try {
            // Estraiamo i dati che arrivano dal "corpo" della richiesta (body)
            const { titolo, descrizione, tecnologie, linkGithub, linkLive } = request.body;

            // Creiamo una nuova istanza del modello con i dati ricevuti
            const newProject = new Project({ titolo, descrizione, tecnologie, linkGithub, linkLive });

            // .save() invia effettivamente il dato al Cloud di MongoDB
            const savedProject = await newProject.save();

            // Restituiamo il progetto appena creato (che ora ha anche un ID univoco)
            return savedProject;
        } catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Errore durante il salvataggio del progetto' });
        }
    });
}