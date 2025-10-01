/**
 * Microservices Architecture Configuration
 * Production-ready microservices design for Stratford AI
 */

export interface ServiceConfig {
  name: string
  version: string
  baseUrl: string
  port: number
  healthCheckPath: string
  documentation: string
  dependencies: string[]
  scaling: ScalingConfig
  security: SecurityConfig
  monitoring: MonitoringConfig
}

export interface ScalingConfig {
  minInstances: number
  maxInstances: number
  targetCpuUtilization: number
  targetMemoryUtilization: number
  scaleUpCooldown: number
  scaleDownCooldown: number
}

export interface SecurityConfig {
  authentication: 'jwt' | 'oauth2' | 'api-key'
  authorization: 'rbac' | 'abac'
  rateLimiting: RateLimitConfig
  cors: CorsConfig
}

export interface RateLimitConfig {
  requestsPerMinute: number
  burstLimit: number
  keyStrategy: 'ip' | 'user' | 'api-key'
}

export interface CorsConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
}

export interface MonitoringConfig {
  healthChecks: HealthCheckConfig[]
  metrics: MetricConfig[]
  logging: LoggingConfig
  tracing: TracingConfig
}

export interface HealthCheckConfig {
  type: 'http' | 'tcp' | 'command'
  endpoint?: string
  interval: number
  timeout: number
  retries: number
}

export interface MetricConfig {
  name: string
  type: 'counter' | 'gauge' | 'histogram'
  description: string
  labels: string[]
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  format: 'json' | 'text'
  aggregation: boolean
}

export interface TracingConfig {
  enabled: boolean
  sampleRate: number
  jaegerEndpoint?: string
}

// Service Registry
export const MICROSERVICES_REGISTRY: Record<string, ServiceConfig> = {
  // Core API Gateway
  'api-gateway': {
    name: 'api-gateway',
    version: '3.0.0',
    baseUrl: process.env.GATEWAY_BASE_URL || 'http://api-gateway:8080',
    port: 8080,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: [],
    scaling: {
      minInstances: 2,
      maxInstances: 10,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 1000,
        burstLimit: 100,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['https://app.stratford-ai.com', 'https://admin.stratford-ai.com'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version'],
        exposedHeaders: ['X-RateLimit-Remaining', 'X-API-Version'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3,
        },
      ],
      metrics: [
        {
          name: 'http_requests_total',
          type: 'counter',
          description: 'Total HTTP requests',
          labels: ['method', 'route', 'status'],
        },
        {
          name: 'http_request_duration',
          type: 'histogram',
          description: 'HTTP request duration',
          labels: ['method', 'route'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.1,
        jaegerEndpoint: process.env.JAEGER_ENDPOINT,
      },
    },
  },

  // User Management Service
  'user-service': {
    name: 'user-service',
    version: '2.1.0',
    baseUrl: process.env.USER_SERVICE_URL || 'http://user-service:8081',
    port: 8081,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['auth-service', 'database-service'],
    scaling: {
      minInstances: 2,
      maxInstances: 8,
      targetCpuUtilization: 60,
      targetMemoryUtilization: 70,
      scaleUpCooldown: 300,
      scaleDownCooldown: 900,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 500,
        burstLimit: 50,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: [],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3,
        },
        {
          type: 'tcp',
          interval: 60,
          timeout: 3,
          retries: 2,
        },
      ],
      metrics: [
        {
          name: 'user_registrations_total',
          type: 'counter',
          description: 'Total user registrations',
          labels: ['source'],
        },
        {
          name: 'active_users',
          type: 'gauge',
          description: 'Currently active users',
          labels: [],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.05,
      },
    },
  },

  // Portfolio Management Service
  'portfolio-service': {
    name: 'portfolio-service',
    version: '3.2.0',
    baseUrl: process.env.PORTFOLIO_SERVICE_URL || 'http://portfolio-service:8082',
    port: 8082,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['user-service', 'market-data-service', 'risk-service'],
    scaling: {
      minInstances: 3,
      maxInstances: 15,
      targetCpuUtilization: 65,
      targetMemoryUtilization: 75,
      scaleUpCooldown: 180,
      scaleDownCooldown: 600,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 800,
        burstLimit: 80,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Portfolio-ID'],
        exposedHeaders: ['X-Portfolio-Performance'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 20,
          timeout: 5,
          retries: 3,
        },
      ],
      metrics: [
        {
          name: 'portfolio_trades_total',
          type: 'counter',
          description: 'Total portfolio trades',
          labels: ['portfolio_id', 'action', 'symbol'],
        },
        {
          name: 'portfolio_value',
          type: 'gauge',
          description: 'Current portfolio value',
          labels: ['portfolio_id', 'currency'],
        },
        {
          name: 'trade_execution_time',
          type: 'histogram',
          description: 'Trade execution time',
          labels: ['action', 'symbol'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.2,
      },
    },
  },

  // Market Data Service
  'market-data-service': {
    name: 'market-data-service',
    version: '2.3.0',
    baseUrl: process.env.MARKET_DATA_SERVICE_URL || 'http://market-data-service:8083',
    port: 8083,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['timescale-service', 'redis-service'],
    scaling: {
      minInstances: 4,
      maxInstances: 20,
      targetCpuUtilization: 80,
      targetMemoryUtilization: 85,
      scaleUpCooldown: 120,
      scaleDownCooldown: 300,
    },
    security: {
      authentication: 'api-key',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 2000,
        burstLimit: 200,
        keyStrategy: 'api-key',
      },
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        exposedHeaders: ['X-Data-Timestamp', 'X-Cache-Status'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 15,
          timeout: 3,
          retries: 2,
        },
      ],
      metrics: [
        {
          name: 'market_data_requests_total',
          type: 'counter',
          description: 'Total market data requests',
          labels: ['symbol', 'interval', 'source'],
        },
        {
          name: 'market_data_latency',
          type: 'histogram',
          description: 'Market data retrieval latency',
          labels: ['source', 'symbol'],
        },
        {
          name: 'data_cache_hit_ratio',
          type: 'gauge',
          description: 'Cache hit ratio for market data',
          labels: ['cache_type'],
        },
      ],
      logging: {
        level: 'warn',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.01,
      },
    },
  },

  // Trading Execution Service
  'trading-service': {
    name: 'trading-service',
    version: '3.1.0',
    baseUrl: process.env.TRADING_SERVICE_URL || 'http://trading-service:8084',
    port: 8084,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['portfolio-service', 'market-data-service', 'risk-service', 'compliance-service'],
    scaling: {
      minInstances: 3,
      maxInstances: 12,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpCooldown: 120,
      scaleDownCooldown: 600,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 300,
        burstLimit: 30,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['https://app.stratford-ai.com'],
        allowedMethods: ['POST', 'GET', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Trade-Confirmation'],
        exposedHeaders: ['X-Trade-ID', 'X-Execution-Time'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 10,
          timeout: 3,
          retries: 3,
        },
      ],
      metrics: [
        {
          name: 'trades_executed_total',
          type: 'counter',
          description: 'Total trades executed',
          labels: ['action', 'symbol', 'status'],
        },
        {
          name: 'trade_execution_latency',
          type: 'histogram',
          description: 'Trade execution latency',
          labels: ['action', 'symbol'],
        },
        {
          name: 'order_rejection_rate',
          type: 'gauge',
          description: 'Order rejection rate',
          labels: ['reason'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 1.0, // Full tracing for trading
      },
    },
  },

  // Risk Management Service
  'risk-service': {
    name: 'risk-service',
    version: '2.0.0',
    baseUrl: process.env.RISK_SERVICE_URL || 'http://risk-service:8085',
    port: 8085,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['portfolio-service', 'market-data-service'],
    scaling: {
      minInstances: 2,
      maxInstances: 8,
      targetCpuUtilization: 75,
      targetMemoryUtilization: 80,
      scaleUpCooldown: 240,
      scaleDownCooldown: 900,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 600,
        burstLimit: 60,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Risk-Score', 'X-VaR-Calculation'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3,
        },
      ],
      metrics: [
        {
          name: 'risk_calculations_total',
          type: 'counter',
          description: 'Total risk calculations',
          labels: ['calculation_type', 'portfolio_id'],
        },
        {
          name: 'portfolio_var',
          type: 'gauge',
          description: 'Portfolio Value at Risk',
          labels: ['portfolio_id', 'confidence_level'],
        },
        {
          name: 'risk_alerts_triggered',
          type: 'counter',
          description: 'Risk alerts triggered',
          labels: ['alert_type', 'severity'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.1,
      },
    },
  },

  // Analytics & ML Service
  'analytics-service': {
    name: 'analytics-service',
    version: '1.5.0',
    baseUrl: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:8086',
    port: 8086,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['market-data-service', 'portfolio-service', 'mongodb-service'],
    scaling: {
      minInstances: 2,
      maxInstances: 10,
      targetCpuUtilization: 85,
      targetMemoryUtilization: 90,
      scaleUpCooldown: 300,
      scaleDownCooldown: 1200,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 200,
        burstLimit: 20,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Model-Version', 'X-Prediction-Confidence'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 60,
          timeout: 10,
          retries: 2,
        },
      ],
      metrics: [
        {
          name: 'predictions_generated_total',
          type: 'counter',
          description: 'Total predictions generated',
          labels: ['model_type', 'symbol'],
        },
        {
          name: 'model_inference_time',
          type: 'histogram',
          description: 'ML model inference time',
          labels: ['model_type'],
        },
        {
          name: 'prediction_accuracy',
          type: 'gauge',
          description: 'Model prediction accuracy',
          labels: ['model_type', 'timeframe'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.05,
      },
    },
  },

  // Compliance & Audit Service
  'compliance-service': {
    name: 'compliance-service',
    version: '2.2.0',
    baseUrl: process.env.COMPLIANCE_SERVICE_URL || 'http://compliance-service:8087',
    port: 8087,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['trading-service', 'user-service'],
    scaling: {
      minInstances: 2,
      maxInstances: 6,
      targetCpuUtilization: 60,
      targetMemoryUtilization: 70,
      scaleUpCooldown: 600,
      scaleDownCooldown: 1800,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 400,
        burstLimit: 40,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['https://admin.stratford-ai.com'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Audit-ID', 'X-Compliance-Status'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3,
        },
      ],
      metrics: [
        {
          name: 'compliance_checks_total',
          type: 'counter',
          description: 'Total compliance checks',
          labels: ['check_type', 'status'],
        },
        {
          name: 'audit_events_total',
          type: 'counter',
          description: 'Total audit events',
          labels: ['event_type', 'severity'],
        },
        {
          name: 'compliance_violations',
          type: 'counter',
          description: 'Compliance violations detected',
          labels: ['violation_type', 'user_id'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 1.0, // Full tracing for compliance
      },
    },
  },

  // Notification Service
  'notification-service': {
    name: 'notification-service',
    version: '1.3.0',
    baseUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8088',
    port: 8088,
    healthCheckPath: '/health',
    documentation: '/docs',
    dependencies: ['user-service', 'redis-service'],
    scaling: {
      minInstances: 2,
      maxInstances: 8,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 75,
      scaleUpCooldown: 300,
      scaleDownCooldown: 900,
    },
    security: {
      authentication: 'jwt',
      authorization: 'rbac',
      rateLimiting: {
        requestsPerMinute: 1000,
        burstLimit: 100,
        keyStrategy: 'user',
      },
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Notification-ID'],
      },
    },
    monitoring: {
      healthChecks: [
        {
          type: 'http',
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3,
        },
      ],
      metrics: [
        {
          name: 'notifications_sent_total',
          type: 'counter',
          description: 'Total notifications sent',
          labels: ['channel', 'type', 'status'],
        },
        {
          name: 'notification_delivery_time',
          type: 'histogram',
          description: 'Notification delivery time',
          labels: ['channel'],
        },
        {
          name: 'notification_failure_rate',
          type: 'gauge',
          description: 'Notification failure rate',
          labels: ['channel'],
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        aggregation: true,
      },
      tracing: {
        enabled: true,
        sampleRate: 0.1,
      },
    },
  },
}

// Service Discovery Interface
export interface ServiceDiscovery {
  register(service: ServiceConfig): Promise<void>
  deregister(serviceName: string): Promise<void>
  discover(serviceName: string): Promise<ServiceConfig | null>
  listServices(): Promise<ServiceConfig[]>
  healthCheck(serviceName: string): Promise<boolean>
}

// Load Balancer Configuration
export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash'
  healthCheck: {
    enabled: boolean
    interval: number
    timeout: number
    unhealthyThreshold: number
    healthyThreshold: number
  }
  stickySessions: boolean
  sslTermination: boolean
}

// Circuit Breaker Configuration
export interface CircuitBreakerConfig {
  failureThreshold: number
  timeout: number
  resetTimeout: number
  monitoringPeriod: number
}

// Service Mesh Configuration
export interface ServiceMeshConfig {
  enabled: boolean
  sidecars: {
    enabled: boolean
    image: string
    resources: {
      cpu: string
      memory: string
    }
  }
  security: {
    mtls: boolean
    encryption: boolean
  }
  observability: {
    tracing: boolean
    metrics: boolean
    logging: boolean
  }
}

export const MICROSERVICES_CONFIG = {
  registry: MICROSERVICES_REGISTRY,
  loadBalancer: {
    algorithm: 'least-connections',
    healthCheck: {
      enabled: true,
      interval: 30,
      timeout: 5,
      unhealthyThreshold: 3,
      healthyThreshold: 2,
    },
    stickySessions: false,
    sslTermination: true,
  } as LoadBalancerConfig,
  circuitBreaker: {
    failureThreshold: 50,
    timeout: 60000,
    resetTimeout: 300000,
    monitoringPeriod: 60000,
  } as CircuitBreakerConfig,
  serviceMesh: {
    enabled: true,
    sidecars: {
      enabled: true,
      image: 'istio/proxyv2:1.18.0',
      resources: {
        cpu: '100m',
        memory: '128Mi',
      },
    },
    security: {
      mtls: true,
      encryption: true,
    },
    observability: {
      tracing: true,
      metrics: true,
      logging: true,
    },
  } as ServiceMeshConfig,
}