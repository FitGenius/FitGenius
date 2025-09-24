/**
 * @jest-environment node
 */

import { GET, HEAD } from '../health/route';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

describe('/api/health', () => {
  const mockRequest = new NextRequest('http://localhost:3000/api/health');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process methods
    jest.spyOn(process, 'uptime').mockReturnValue(3600);
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 50000000,
      heapTotal: 30000000,
      heapUsed: 25000000,
      external: 5000000,
      arrayBuffers: 1000000,
    });
    jest.spyOn(process, 'cpuUsage').mockReturnValue({
      user: 100000,
      system: 50000,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when database is working', async () => {
      // Mock successful database query
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('healthy');
      expect(data.uptime).toBe(3600);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('memory');
      expect(data).toHaveProperty('cpu');
    });

    it('should return degraded status when database fails', async () => {
      // Mock database failure
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.database).toBe('unhealthy');
    });

    it('should include memory usage information', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(data.memory).toBeDefined();
      expect(data.memory.used).toBe(24.41); // 25000000 / 1024 / 1024, rounded to 2 decimals
      expect(data.memory.total).toBe(28.61); // 30000000 / 1024 / 1024, rounded to 2 decimals
      expect(data.memory.limit).toBe(47.68); // 50000000 / 1024 / 1024, rounded to 2 decimals
    });

    it('should include CPU usage information', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(data.cpu).toBeDefined();
      expect(data.cpu.usage).toEqual({
        user: 100000,
        system: 50000,
      });
      expect(data.cpu.load).toBeDefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error during health check
      jest.spyOn(process, 'uptime').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Internal server error');
      expect(data).toHaveProperty('timestamp');
    });

    it('should set correct response headers', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('HEAD /api/health', () => {
    it('should return 200 when database is healthy', async () => {
      // Mock successful database query
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('should return 503 when database is unhealthy', async () => {
      // Mock database failure
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const response = await HEAD();

      expect(response.status).toBe(503);
      expect(response.body).toBeNull();
    });

    it('should be faster than GET request', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const headStart = Date.now();
      await HEAD();
      const headTime = Date.now() - headStart;

      const getStart = Date.now();
      await GET();
      const getTime = Date.now() - getStart;

      // HEAD should be faster or equal (allowing for test timing variations)
      expect(headTime).toBeLessThanOrEqual(getTime + 10);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle high memory usage scenario', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      // Mock high memory usage
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 1000000000, // 1GB
        heapTotal: 800000000, // 800MB
        heapUsed: 750000000, // 750MB
        external: 50000000,
        arrayBuffers: 10000000,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memory.used).toBeGreaterThan(700); // Should be around 715MB
      expect(data.memory.limit).toBeGreaterThan(900); // Should be around 953MB
    });

    it('should handle long uptime scenario', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      // Mock long uptime (7 days in seconds)
      jest.spyOn(process, 'uptime').mockReturnValue(604800);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.uptime).toBe(604800);
      expect(data.status).toBe('healthy');
    });
  });
});