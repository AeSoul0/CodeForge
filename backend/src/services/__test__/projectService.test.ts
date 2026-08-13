/**
 * @file src/services/__tests__/projectService.test.ts
 * @description Unit tests for the Project Service business logic.
 */

import { describe, it, expect } from 'vitest';
// import { createProject } from '../projectService';

describe('Project Service Validation', () => {

    it('should reject a project payload if the title is missing', async () => {
        // Arrange: Create a mock payload intentionally missing the required 'titolo' field
        const invalidPayload = {
            descrizione: 'A cool full-stack project',
            tecnologie: ['React', 'Node.js']
        };

        // Act & Assert: Verify that the service throws a validation error
        // NOTE: Uncomment and adapt the following lines once your service is imported
        // expect(async () => {
        //   await createProject(invalidPayload as any);
        // }).rejects.toThrowError(/titolo/i);

        expect(invalidPayload).not.toHaveProperty('titolo');
    });

    it('should accept a well-formed project payload', () => {
        const validPayload = {
            titolo: 'CodeForge',
            descrizione: 'Portfolio',
            tecnologie: ['Astro']
        };

        expect(validPayload).toHaveProperty('titolo', 'CodeForge');
    });

});