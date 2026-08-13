/**
 * @file backend/src/controllers/projectController.ts
 * @description Controller handling business logic for the Projects resource.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import Project from '../models/Projects';

/**
 * Retrieves all projects from the database.
 */
export const getProjects = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        // 1. Esegue la query su MongoDB, ordinando per i più recenti
        const projects = await Project.find().sort({ createdAt: -1 });

        // 2. Invia i dati veri al frontend
        return reply.send(projects);
    } catch (error) {
        throw error;
    }
};

/**
 * Creates a new project in the database.
 */
export const createProject = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const projectData = request.body as { [x: string]: any };

        // Scrive i dati su MongoDB
        const newProject = await Project.create(projectData);

        return reply.status(201).send({
            success: true,
            message: 'Project created successfully.',
            data: newProject
        });
    } catch (error) {
        throw error;
    }
};