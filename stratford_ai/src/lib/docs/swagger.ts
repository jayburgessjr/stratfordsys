import swaggerJSDoc from 'swagger-jsdoc'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Stratford AI Wealth Engine API',
    version: '1.0.0',
    description: `
# Stratford AI Wealth Engine API

Enterprise-grade financial trading platform API with comprehensive compliance and security features.

## Features

- **Authentication & Authorization**: NextAuth.js with JWT tokens
- **Rate Limiting**: Configurable rate limits per endpoint
- **Field-Level Encryption**: Sensitive financial data encryption
- **KYC/AML Compliance**: Automated verification workflows
- **Audit Trails**: Complete activity logging for compliance
- **Data Retention**: Automated policies for regulatory compliance

## Security

All endpoints require authentication unless specified otherwise. Sensitive data is encrypted at rest and in transit.

## Compliance

This API is designed to comply with:
- SEC regulations for financial data retention
- FINRA requirements for transaction reporting
- GDPR for data privacy and user rights
- SOX for audit trails and financial reporting
- AML/BSA for anti-money laundering

## Rate Limits

Default rate limits:
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per minute
- Trading endpoints: 10 requests per minute
- Public endpoints: 1000 requests per minute
    `,
    contact: {
      name: 'Stratford AI Support',
      url: 'https://stratford.ai/support',
      email: 'api@stratford.ai'
    },
    license: {
      name: 'Proprietary',
      url: 'https://stratford.ai/license'
    }
  },
  servers: [
    {
      url: 'https://app.stratford.ai/api',
      description: 'Production server'
    },
    {
      url: 'https://staging.stratford.ai/api',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from NextAuth'
      },
      CSRFToken: {
        type: 'apiKey',
        in: 'header',
        name: 'x-csrf-token',
        description: 'CSRF protection token'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error type'
          },
          message: {
            type: 'string',
            description: 'Human-readable error message'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        },
        required: ['error', 'message']
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          firstName: {
            type: 'string',
            description: 'User first name'
          },
          lastName: {
            type: 'string',
            description: 'User last name'
          },
          role: {
            type: 'string',
            enum: ['USER', 'TRADER', 'ADMIN', 'COMPLIANCE'],
            description: 'User role'
          },
          kycStatus: {
            type: 'string',
            enum: ['PENDING', 'VERIFIED', 'REJECTED'],
            description: 'KYC verification status'
          },
          amlStatus: {
            type: 'string',
            enum: ['PENDING', 'CLEARED', 'FLAGGED'],
            description: 'AML screening status'
          },
          riskLevel: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            description: 'Risk assessment level'
          }
        }
      },
      Portfolio: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Portfolio identifier'
          },
          name: {
            type: 'string',
            description: 'Portfolio name'
          },
          description: {
            type: 'string',
            description: 'Portfolio description'
          },
          currency: {
            type: 'string',
            default: 'USD',
            description: 'Base currency'
          },
          initialValue: {
            type: 'number',
            format: 'decimal',
            description: 'Initial portfolio value'
          },
          currentValue: {
            type: 'number',
            format: 'decimal',
            description: 'Current portfolio value'
          },
          isActive: {
            type: 'boolean',
            description: 'Portfolio status'
          }
        }
      },
      Trade: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Trade identifier'
          },
          symbol: {
            type: 'string',
            description: 'Trading symbol'
          },
          side: {
            type: 'string',
            enum: ['BUY', 'SELL'],
            description: 'Trade side'
          },
          quantity: {
            type: 'number',
            format: 'decimal',
            description: 'Trade quantity'
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Trade price'
          },
          totalValue: {
            type: 'number',
            format: 'decimal',
            description: 'Total trade value'
          },
          tradeType: {
            type: 'string',
            enum: ['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'],
            description: 'Order type'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'FILLED', 'PARTIAL', 'CANCELLED'],
            description: 'Trade status'
          }
        }
      },
      Strategy: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Strategy identifier'
          },
          name: {
            type: 'string',
            description: 'Strategy name'
          },
          description: {
            type: 'string',
            description: 'Strategy description'
          },
          category: {
            type: 'string',
            enum: ['TECHNICAL', 'FUNDAMENTAL', 'QUANTITATIVE', 'ARBITRAGE'],
            description: 'Strategy category'
          },
          parameters: {
            type: 'object',
            description: 'Strategy parameters'
          },
          performance: {
            type: 'object',
            properties: {
              totalReturn: {
                type: 'number',
                format: 'decimal',
                description: 'Total return percentage'
              },
              sharpeRatio: {
                type: 'number',
                format: 'decimal',
                description: 'Sharpe ratio'
              },
              maxDrawdown: {
                type: 'number',
                format: 'decimal',
                description: 'Maximum drawdown percentage'
              },
              winRate: {
                type: 'number',
                format: 'decimal',
                description: 'Win rate percentage'
              }
            }
          }
        }
      },
      KYCSubmission: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            description: 'Full legal name'
          },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            description: 'Date of birth'
          },
          nationality: {
            type: 'string',
            description: 'Nationality (ISO country code)'
          },
          ssn: {
            type: 'string',
            description: 'Social Security Number (encrypted)'
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' }
            },
            required: ['street', 'city', 'state', 'zipCode', 'country']
          },
          identityDocument: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID']
              },
              number: { type: 'string' },
              expiryDate: { type: 'string', format: 'date' },
              images: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        },
        required: ['fullName', 'dateOfBirth', 'nationality', 'address', 'identityDocument']
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Unauthorized',
              message: 'Authentication required'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Forbidden',
              message: 'Insufficient permissions for this operation'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/Error' },
                {
                  type: 'object',
                  properties: {
                    retryAfter: {
                      type: 'integer',
                      description: 'Seconds until retry allowed'
                    }
                  }
                }
              ]
            },
            example: {
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Please try again later.',
              retryAfter: 300
            }
          }
        }
      },
      ValidationError: {
        description: 'Input validation failed',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/Error' },
                {
                  type: 'object',
                  properties: {
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    },
    {
      CSRFToken: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Portfolios',
      description: 'Portfolio management'
    },
    {
      name: 'Trading',
      description: 'Trading operations and order management'
    },
    {
      name: 'Strategies',
      description: 'Trading strategy management'
    },
    {
      name: 'Market Data',
      description: 'Market data and indicators'
    },
    {
      name: 'Compliance',
      description: 'KYC, AML, and regulatory compliance'
    },
    {
      name: 'Analytics',
      description: 'Performance analytics and reporting'
    },
    {
      name: 'System',
      description: 'System health and monitoring'
    }
  ]
}

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/pages/api/**/*.ts',
    './src/lib/docs/paths/**/*.ts'
  ],
}

export const swaggerSpec = swaggerJSDoc(options)