/**
 * API Versioning Strategy for Stratford AI
 * Production-grade API versioning with backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server'

export type ApiVersion = 'v1' | 'v2' | 'v3'
export type VersioningStrategy = 'header' | 'url' | 'query' | 'content-type'

export interface ApiVersionConfig {
  current: ApiVersion
  supported: ApiVersion[]
  deprecated: ApiVersion[]
  strategy: VersioningStrategy
  defaultVersion: ApiVersion
  deprecationWarnings: boolean
}

export interface VersionedEndpoint {
  version: ApiVersion
  handler: (request: NextRequest) => Promise<NextResponse>
  deprecatedAt?: Date
  removedAt?: Date
  breaking?: boolean
}

export interface ApiVersionInfo {
  version: ApiVersion
  releaseDate: Date
  deprecationDate?: Date
  endOfLifeDate?: Date
  breaking: boolean
  changelog: string[]
  migrationGuide?: string
}

class ApiVersionHandler {
  private config: ApiVersionConfig
  private versionInfo: Map<ApiVersion, ApiVersionInfo>
  private endpoints: Map<string, Map<ApiVersion, VersionedEndpoint>>

  constructor(config: ApiVersionConfig) {
    this.config = config
    this.versionInfo = new Map()
    this.endpoints = new Map()
    this.initializeVersionInfo()
  }

  private initializeVersionInfo(): void {
    // Version 1.0 - Initial API
    this.versionInfo.set('v1', {
      version: 'v1',
      releaseDate: new Date('2024-01-01'),
      deprecationDate: new Date('2024-06-01'),
      endOfLifeDate: new Date('2024-12-01'),
      breaking: false,
      changelog: [
        'Initial API release',
        'Basic portfolio management',
        'Market data endpoints',
        'User authentication'
      ],
      migrationGuide: '/docs/api/v1-to-v2-migration'
    })

    // Version 2.0 - Enhanced Features
    this.versionInfo.set('v2', {
      version: 'v2',
      releaseDate: new Date('2024-04-01'),
      deprecationDate: new Date('2025-01-01'),
      endOfLifeDate: new Date('2025-06-01'),
      breaking: true,
      changelog: [
        'Enhanced portfolio analytics',
        'Real-time trading signals',
        'Advanced risk metrics',
        'Breaking: Changed response format for /portfolios endpoint',
        'Breaking: Removed deprecated /user/profile endpoint'
      ],
      migrationGuide: '/docs/api/v2-migration-guide'
    })

    // Version 3.0 - Latest Features
    this.versionInfo.set('v3', {
      version: 'v3',
      releaseDate: new Date('2024-10-01'),
      breaking: true,
      changelog: [
        'AI-powered trading recommendations',
        'Advanced backtesting framework',
        'Real-time portfolio optimization',
        'Enhanced security and compliance',
        'GraphQL support',
        'Breaking: Restructured authentication flow',
        'Breaking: New rate limiting structure'
      ],
      migrationGuide: '/docs/api/v3-migration-guide'
    })
  }

  /**
   * Extract API version from request
   */
  public extractVersion(request: NextRequest): ApiVersion {
    switch (this.config.strategy) {
      case 'header':
        return this.extractVersionFromHeader(request)
      case 'url':
        return this.extractVersionFromUrl(request)
      case 'query':
        return this.extractVersionFromQuery(request)
      case 'content-type':
        return this.extractVersionFromContentType(request)
      default:
        return this.config.defaultVersion
    }
  }

  private extractVersionFromHeader(request: NextRequest): ApiVersion {
    const versionHeader = request.headers.get('api-version') ||
                         request.headers.get('x-api-version') ||
                         request.headers.get('stratford-api-version')

    if (versionHeader && this.isValidVersion(versionHeader as ApiVersion)) {
      return versionHeader as ApiVersion
    }

    return this.config.defaultVersion
  }

  private extractVersionFromUrl(request: NextRequest): ApiVersion {
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')

    // Look for version in URL like /api/v2/portfolios
    const versionSegment = pathSegments.find(segment => /^v\d+$/.test(segment))

    if (versionSegment && this.isValidVersion(versionSegment as ApiVersion)) {
      return versionSegment as ApiVersion
    }

    return this.config.defaultVersion
  }

  private extractVersionFromQuery(request: NextRequest): ApiVersion {
    const url = new URL(request.url)
    const version = url.searchParams.get('version') || url.searchParams.get('api_version')

    if (version && this.isValidVersion(version as ApiVersion)) {
      return version as ApiVersion
    }

    return this.config.defaultVersion
  }

  private extractVersionFromContentType(request: NextRequest): ApiVersion {
    const contentType = request.headers.get('content-type') || ''

    // Look for version in content type like application/vnd.stratford.v2+json
    const versionMatch = contentType.match(/vnd\.stratford\.([^+]+)/)

    if (versionMatch && versionMatch[1] && this.isValidVersion(versionMatch[1] as ApiVersion)) {
      return versionMatch[1] as ApiVersion
    }

    return this.config.defaultVersion
  }

  /**
   * Register versioned endpoint
   */
  public registerEndpoint(
    path: string,
    version: ApiVersion,
    handler: (request: NextRequest) => Promise<NextResponse>,
    options?: {
      deprecatedAt?: Date
      removedAt?: Date
      breaking?: boolean
    }
  ): void {
    if (!this.endpoints.has(path)) {
      this.endpoints.set(path, new Map())
    }

    const pathEndpoints = this.endpoints.get(path)!
    pathEndpoints.set(version, {
      version,
      handler,
      deprecatedAt: options?.deprecatedAt,
      removedAt: options?.removedAt,
      breaking: options?.breaking || false
    })
  }

  /**
   * Route request to appropriate version handler
   */
  public async routeRequest(
    path: string,
    request: NextRequest
  ): Promise<NextResponse> {
    const requestedVersion = this.extractVersion(request)
    const pathEndpoints = this.endpoints.get(path)

    if (!pathEndpoints) {
      return this.createErrorResponse('Endpoint not found', 404, requestedVersion)
    }

    // Check if requested version exists
    let endpoint = pathEndpoints.get(requestedVersion)

    if (!endpoint) {
      // Try to find the closest supported version
      endpoint = this.findClosestVersion(pathEndpoints, requestedVersion)

      if (!endpoint) {
        return this.createErrorResponse(
          `API version ${requestedVersion} is not supported for this endpoint`,
          400,
          requestedVersion
        )
      }
    }

    // Check if version is deprecated
    if (this.isVersionDeprecated(endpoint.version)) {
      // Add deprecation warning to response headers
      const response = await endpoint.handler(request)
      this.addDeprecationHeaders(response, endpoint.version)
      return response
    }

    // Check if version is removed
    if (this.isVersionRemoved(endpoint.version)) {
      return this.createErrorResponse(
        `API version ${endpoint.version} has been removed. Please upgrade to version ${this.config.current}`,
        410,
        requestedVersion
      )
    }

    return await endpoint.handler(request)
  }

  private findClosestVersion(
    pathEndpoints: Map<ApiVersion, VersionedEndpoint>,
    requestedVersion: ApiVersion
  ): VersionedEndpoint | null {
    // Simple fallback strategy - return the latest supported version
    const supportedVersions = Array.from(pathEndpoints.keys())
      .filter(v => this.config.supported.includes(v))
      .sort()
      .reverse()

    return supportedVersions.length > 0 ? pathEndpoints.get(supportedVersions[0]) || null : null
  }

  private isValidVersion(version: ApiVersion): boolean {
    return this.config.supported.includes(version)
  }

  private isVersionDeprecated(version: ApiVersion): boolean {
    const versionInfo = this.versionInfo.get(version)
    if (!versionInfo?.deprecationDate) return false

    return new Date() >= versionInfo.deprecationDate
  }

  private isVersionRemoved(version: ApiVersion): boolean {
    const versionInfo = this.versionInfo.get(version)
    if (!versionInfo?.endOfLifeDate) return false

    return new Date() >= versionInfo.endOfLifeDate
  }

  private addDeprecationHeaders(response: NextResponse, version: ApiVersion): void {
    if (!this.config.deprecationWarnings) return

    const versionInfo = this.versionInfo.get(version)
    if (!versionInfo) return

    response.headers.set('X-API-Deprecated', 'true')
    response.headers.set('X-API-Deprecated-Version', version)
    response.headers.set('X-API-Current-Version', this.config.current)

    if (versionInfo.endOfLifeDate) {
      response.headers.set('X-API-Deprecation-Date', versionInfo.endOfLifeDate.toISOString())
    }

    if (versionInfo.migrationGuide) {
      response.headers.set('X-API-Migration-Guide', versionInfo.migrationGuide)
    }

    // Add Link header for new version
    response.headers.set('Link', `</api/${this.config.current}>; rel="successor-version"`)
  }

  private createErrorResponse(
    message: string,
    status: number,
    requestedVersion: ApiVersion
  ): NextResponse {
    const errorResponse = {
      error: {
        message,
        code: `API_VERSION_ERROR_${status}`,
        requestedVersion,
        supportedVersions: this.config.supported,
        currentVersion: this.config.current,
        timestamp: new Date().toISOString()
      }
    }

    const response = NextResponse.json(errorResponse, { status })
    response.headers.set('X-API-Current-Version', this.config.current)
    response.headers.set('X-API-Supported-Versions', this.config.supported.join(', '))

    return response
  }

  /**
   * Get version information
   */
  public getVersionInfo(version?: ApiVersion): ApiVersionInfo | ApiVersionInfo[] {
    if (version) {
      const info = this.versionInfo.get(version)
      if (!info) {
        throw new Error(`Version ${version} not found`)
      }
      return info
    }

    return Array.from(this.versionInfo.values())
  }

  /**
   * Generate API documentation for versions
   */
  public generateVersionDocs(): Record<ApiVersion, any> {
    const docs: Record<string, any> = {}

    for (const [version, info] of this.versionInfo) {
      docs[version] = {
        version: info.version,
        releaseDate: info.releaseDate,
        deprecationDate: info.deprecationDate,
        endOfLifeDate: info.endOfLifeDate,
        breaking: info.breaking,
        changelog: info.changelog,
        migrationGuide: info.migrationGuide,
        status: this.getVersionStatus(version),
        endpoints: this.getEndpointsForVersion(version)
      }
    }

    return docs
  }

  private getVersionStatus(version: ApiVersion): string {
    if (this.isVersionRemoved(version)) return 'removed'
    if (this.isVersionDeprecated(version)) return 'deprecated'
    if (version === this.config.current) return 'current'
    if (this.config.supported.includes(version)) return 'supported'
    return 'unsupported'
  }

  private getEndpointsForVersion(version: ApiVersion): string[] {
    const endpoints: string[] = []

    for (const [path, pathEndpoints] of this.endpoints) {
      if (pathEndpoints.has(version)) {
        endpoints.push(path)
      }
    }

    return endpoints
  }

  /**
   * Middleware for automatic version handling
   */
  public middleware() {
    return async (request: NextRequest): Promise<NextResponse | undefined> => {
      const url = new URL(request.url)

      // Only handle API routes
      if (!url.pathname.startsWith('/api/')) {
        return undefined
      }

      // Extract the API path without version
      const apiPath = this.normalizeApiPath(url.pathname)

      // Route to appropriate version handler
      if (this.endpoints.has(apiPath)) {
        return await this.routeRequest(apiPath, request)
      }

      return undefined
    }
  }

  private normalizeApiPath(pathname: string): string {
    // Remove version from path: /api/v2/portfolios -> /api/portfolios
    return pathname.replace(/\/api\/v\d+/, '/api')
  }
}

// Default configuration
const defaultConfig: ApiVersionConfig = {
  current: 'v3',
  supported: ['v2', 'v3'],
  deprecated: ['v1'],
  strategy: 'header',
  defaultVersion: 'v3',
  deprecationWarnings: true
}

// Singleton instance
let versionHandler: ApiVersionHandler | null = null

export function initializeApiVersioning(config?: Partial<ApiVersionConfig>): ApiVersionHandler {
  if (!versionHandler) {
    versionHandler = new ApiVersionHandler({ ...defaultConfig, ...config })
  }
  return versionHandler
}

export function getApiVersionHandler(): ApiVersionHandler {
  if (!versionHandler) {
    versionHandler = new ApiVersionHandler(defaultConfig)
  }
  return versionHandler
}

// Decorator for versioned API routes
export function versionedApi(version: ApiVersion, options?: {
  deprecatedAt?: Date
  removedAt?: Date
  breaking?: boolean
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const handler = getApiVersionHandler()
      const request = args[0] as NextRequest

      // Register this endpoint if not already registered
      const url = new URL(request.url)
      const path = handler['normalizeApiPath'](url.pathname)

      handler.registerEndpoint(path, version, originalMethod.bind(this), options)

      return await originalMethod.apply(this, args)
    }

    return descriptor
  }
}

export { ApiVersionHandler }