import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../index.js';
import { setupTestDatabase, cleanupTestDatabase } from './setup.js';

describe('Snapshots API Integration Tests', () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;
  let terminalId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Get tokens
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
    // Clean up and create fresh terminal
    await prisma.snapshot.deleteMany();
    await prisma.terminalCommand.deleteMany();
    await prisma.terminal.deleteMany();

    const createResponse = await request(app)
      .post('/api/terminals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Snapshot Test Terminal' });
    terminalId = createResponse.body.id;
  });

  describe('GET /api/snapshots', () => {
    it('should return empty list initially', async () => {
      const response = await request(app)
        .get('/api/snapshots')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/snapshots');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/snapshots', () => {
    it('admin should create snapshot', async () => {
      const response = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Snapshot', terminalId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Test Snapshot');
      expect(response.body).toHaveProperty('terminalId', terminalId);
      expect(response.body).toHaveProperty('state');
    });

    it('operator should create snapshot', async () => {
      const response = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Operator Snapshot', terminalId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Operator Snapshot');
    });

    it('viewer should not create snapshot', async () => {
      const response = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Viewer Snapshot', terminalId });

      expect(response.status).toBe(403);
    });

    it('should preserve terminal state in snapshot', async () => {
      // Execute some commands to change state
      await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'mkdir testdir' });

      await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'cd testdir' });

      // Create snapshot
      const response = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'State Snapshot', terminalId });

      expect(response.status).toBe(201);
      const state = JSON.parse(response.body.state);
      expect(state).toHaveProperty('workingDir', '/home/user/testdir');
    });
  });

  describe('GET /api/snapshots/:id', () => {
    let snapshotId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Get Test Snapshot', terminalId });
      snapshotId = createResponse.body.id;
    });

    it('should return snapshot details', async () => {
      const response = await request(app)
        .get(`/api/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', snapshotId);
      expect(response.body).toHaveProperty('name', 'Get Test Snapshot');
    });

    it('should return 404 for non-existent snapshot', async () => {
      const response = await request(app)
        .get('/api/snapshots/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/snapshots/:id/restore', () => {
    let snapshotId: string;

    beforeEach(async () => {
      // Create snapshot with specific state
      await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'export MYVAR=hello' });

      const createResponse = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Restore Test Snapshot', terminalId });
      snapshotId = createResponse.body.id;

      // Change terminal state
      await request(app)
        .post(`/api/terminals/${terminalId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ command: 'export MYVAR=changed' });
    });

    it('admin should restore snapshot', async () => {
      const response = await request(app)
        .post(`/api/snapshots/${snapshotId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('viewer should not restore snapshot', async () => {
      const response = await request(app)
        .post(`/api/snapshots/${snapshotId}/restore`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/snapshots/:id', () => {
    let snapshotId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/snapshots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Delete Test Snapshot', terminalId });
      snapshotId = createResponse.body.id;
    });

    it('admin should delete snapshot', async () => {
      const response = await request(app)
        .delete(`/api/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('viewer should not delete snapshot', async () => {
      const response = await request(app)
        .delete(`/api/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
