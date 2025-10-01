/**
 * Health Check API Route (App Router)
 *
 * Provides application health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  build: {
    time: string;
    id: string;
  };
  services: {
    database: 'connected' | 'disconnected' | 'not_configured';
    cache: 'connected' | 'disconnected' | 'not_configured';
    external_apis: 'operational' | 'degraded' | 'down';
  };
  metrics: {
    memory_usage: number;
    cpu_usage?: number;
  };
}

export async function GET() {
  try {
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Check service health (simplified for demo)
    const services = {
      database: 'not_configured' as const,
      cache: 'not_configured' as const,
      external_apis: 'operational' as const,
    };

    // Determine overall health
    const isHealthy = Object.values(services).every(
      status => ['operational', 'connected', 'not_configured'].includes(status)
    );

    const healthResponse: HealthResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env['STRATFORD_VERSION'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      uptime: Math.floor(uptime),
      build: {
        time: process.env['BUILD_TIME'] || new Date().toISOString(),
        id: process.env['VERCEL_GIT_COMMIT_SHA']?.slice(0, 7) || 'local',
      },
      services,
      metrics: {
        memory_usage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      },
    };

    // Set appropriate cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    headers.set('Content-Type', 'application/json');

    // Return appropriate HTTP status
    const statusCode = isHealthy ? 200 : 503;

    return new NextResponse(JSON.stringify(healthResponse, null, 2), {
      status: statusCode,
      headers,
    });

  } catch (error) {
    // Health check itself failed
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env['STRATFORD_VERSION'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      uptime: Math.floor(process.uptime()),
      build: {
        time: process.env['BUILD_TIME'] || new Date().toISOString(),
        id: process.env['VERCEL_GIT_COMMIT_SHA']?.slice(0, 7) || 'local',
      },
      services: {
        database: 'disconnected',
        cache: 'disconnected',
        external_apis: 'down',
      },
      metrics: {
        memory_usage: 0,
      },
    };

    return new NextResponse(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
}