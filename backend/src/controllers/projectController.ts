/**
 * backend/src/controllers/projectController.ts
 * * Architecture Layer: Controller / Application Layer
 * Responsibility: Intercepts validated HTTP requests, orchestrates business logic execution 
 * via the Service layer, and constructs standard HTTP responses.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as projectService from '../services/projectService';

/**
 * Interface defining the exact structure expected in the body of a POST request.
 */
interface CreateProjectBody {
    titolo: string;
    descrizione: string;
    image?: string;
    tecnologie: string[];
    linkGithub?: string;
}

/**
 * Handles GET requests to retrieve all projects.
 */
export const getProjectsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const projects = await projectService.getAllProjects();
        return reply.status(200).send(projects);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Failed to retrieve projects.' });
    }
};

/**
 * Handles POST requests to create a newly submitted project.
 * Uses generic types to strictly enforce the request body structure.
 */
export const createProjectHandler = async (
    request: FastifyRequest<{ Body: CreateProjectBody }>,
    reply: FastifyReply
) => {
    try {
        const createdProject = await projectService.createProject(request.body);
        return reply.status(201).send(createdProject);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Failed to create the project.' });
    }
};