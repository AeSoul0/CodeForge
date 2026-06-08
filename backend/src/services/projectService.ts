/**
 * backend/src/services/projectService.ts
 * * Architecture Layer: Business Logic / Service Layer
 * Responsibility: Handles all direct data manipulations and database interactions.
 * Strictly typed using the IProject interface from the data model.
 */

import Project, { IProject } from '../models/Projects';

/**
 * Retrieves the complete catalog of projects from the database.
 * @returns {Promise<IProject[]>} Collection of strongly-typed project documents.
 */
export const getAllProjects = async (): Promise<IProject[]> => {
    return await Project.find().sort({ createdAt: -1 });
};

/**
 * Persists a new project entity into the database.
 * @param {Partial<IProject>} projectData - The sanitized payload representing the project.
 * @returns {Promise<IProject>} The newly created database document.
 */
export const createProject = async (projectData: Partial<IProject>): Promise<IProject> => {
    const newProject = new Project(projectData);
    return await newProject.save();
};