// Import the model we just created to communicate with MongoDB
import Project from '../models/Projects.js';

export default async function projectRoutes(fastify, options) {

    // GET ROUTE: Used to read all projects from the DB
    // Live URL: https://codeforge-ukq5.onrender.com/api/projects
    fastify.get('/api/projects', async (request, reply) => {
        try {
            // .find() without filters returns ALL documents in the collection
            const projects = await Project.find();
            return projects;
        } catch (err) {
            // If something goes wrong, log the error and notify the user
            fastify.log.error(err);
            reply.status(500).send({ error: 'Unable to retrieve projects' });
        }
    });

    // POST ROUTE: Used to save a new project to the DB and trigger automatic frontend redeployment
    // Live URL: https://codeforge-ukq5.onrender.com/api/projects
    fastify.post('/api/projects', async (request, reply) => {
        try {
            // Extract the data coming from the request body
            const { titolo, descrizione, tecnologie, linkGithub, linkLive } = request.body;

            // Create a new instance of the model with the received data
            const newProject = new Project({ titolo, descrizione, tecnologie, linkGithub, linkLive });

            // .save() actually sends the data to the MongoDB Cloud
            const savedProject = await newProject.save();

            // --- VERCEL AUTO-DEPLOY AUTOMATION ---
            // If the Webhook variable is configured within Render's environment variables,
            // we send a notification to Vercel telling Astro to regenerate static pages with the new project.
            if (process.env.VERCEL_DEPLOY_WEBHOOK) {
                fetch(process.env.VERCEL_DEPLOY_WEBHOOK, { method: 'POST' })
                    .then(() => fastify.log.info('🚀 [Webhook] Trigger sent. Vercel auto-redeploy activated successfully.'))
                    .catch((webhookErr) => fastify.log.error('❌ [Webhook] Error during Vercel call:', webhookErr));
            }
            // -------------------------------------

            // Return the newly created project (which now possesses a unique ID)
            return savedProject;
        } catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Error while saving the project' });
        }
    });
}