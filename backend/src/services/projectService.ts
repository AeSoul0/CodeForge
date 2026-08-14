/**
 * backend/src/services/projectService.ts
 * * Architecture Layer: Business Logic / Service Layer
 * Responsibility: Handles all direct data manipulations and database interactions.
 * Strictly typed using the IProject interface from the data model.
 */

import Project from '../models/Projects';

// The project model exports the Mongoose model as the default export, so derive the
// document instance type from the model itself instead of importing a missing named type.
type IProject = InstanceType<typeof Project>;

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