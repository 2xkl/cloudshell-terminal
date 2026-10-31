import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../db.js';
import { setupTestDatabase, cleanupTestDatabase } from './setup.js';

describe('Terminals API Integration Tests', () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Get tokens for different roles
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'password123' });
    adminToken = adminLogin.body.token;

    const operatorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@test.local', password: 'password123' });
    operatorToken = operatorLogin.body.token;

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@test.local', password: 'password123' });
    viewerToken = viewerLogin.body.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up terminals before each test
    await prisma.terminalCommand.deleteMany();
    await prisma.terminal.deleteMany();
  });

  describe('GET /api/terminals', () => {
    it('should return empty list initially', async () => {
      const response = await request(app)
        .get('/api/terminals')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/terminals');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/terminals', () => {
    it('admin should create terminal', async () => {
      const response = await request(app)
        .post('/api/terminals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Terminal' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Test Terminal');
      expect(response.body).toHaveProperty('status', 'RUNNING');
      expect(response.body).toHaveProperty('workingDir', '/home/user');
    });

    it('operator should create terminal', async () => {
      const response = await request(app)
        .post('/api/terminals')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Operator Terminal' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Operator Terminal');
    });

    it('viewer should not create terminal', async () => {
      const response = await request(app)
        .post('/api/terminals')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Viewer Terminal' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/terminals/:id', () => {
    let terminalId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/terminals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Get Test Terminal' });
      terminalId = createResponse.body.id;
    });

    it('should return terminal details', async () => {
      const response = await request(app)
        .get(`/api/terminals/${terminalId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', terminalId);
      expect(response.body).toHaveProperty('name', 'Get Test Terminal');
    });

    it('should return 404 for non-existent terminal', async () => {
      const response = await request(app)
        .get('/api/terminals/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/terminals/:id/execute', () => {
    let terminalId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/terminals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Execute Test Terminal' });
      terminalId = createResponse.body.id;
    });

    it('should execute pwd command', async () => {
      const response = await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'pwd' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('command', 'pwd');
      expect(response.body).toHaveProperty('output', '/home/user');
      expect(response.body).toHaveProperty('exitCode', 0);
    });

    it('should execute ls command', async () => {
      const response = await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'ls' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('command', 'ls');
      expect(response.body).toHaveProperty('exitCode', 0);
    });

    it('should execute help command', async () => {
      const response = await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'help' });

      expect(response.status).toBe(200);
      expect(response.body.output).toContain('Available commands');
    });

    it('should handle invalid command', async () => {
      const response = await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'invalidcmd' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('exitCode', 127);
    });

    it('viewer should not execute commands', async () => {
      const response = await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ command: 'pwd' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/terminals/:id', () => {
    let terminalId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/terminals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Delete Test Terminal' });
      terminalId = createResponse.body.id;
    });

    it('admin should delete terminal', async () => {
      const response = await request(app)
        .delete(`/api/terminals/${terminalId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/terminals/${terminalId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('viewer should not delete terminal', async () => {
      const response = await request(app)
        .delete(`/api/terminals/${terminalId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
