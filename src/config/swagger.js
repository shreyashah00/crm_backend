const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart CRM Mulyaankan API',
    version: '1.0.0',
    description: 'Production-ready REST API backend for the Smart CRM Mulyaankan school conversion workspace.',
    contact: {
      name: 'Development Team',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5001}`,
      description: 'Local Development Server',
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate User / Session Entry',
        description: 'Authenticates a user via email/password or bypasses validation via userId for showcase demonstration.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@alphabett.com' },
                  password: { type: 'string', example: 'password123' },
                  userId: { type: 'integer', description: 'Showcase bypass user ID', example: 3 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'CRM Administrator' },
                            email: { type: 'string', example: 'admin@alphabett.com' },
                            role: { type: 'string', example: 'ADMIN' },
                            active: { type: 'boolean', example: true },
                            designation: { type: 'string', example: 'System Administrator' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Invalid credentials or expired session' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Info',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 3 },
                    name: { type: 'string', example: 'Ramesh Chaudhary' },
                    email: { type: 'string', example: 'ramesh.chaudhary@alphabett.demo' },
                    role: { type: 'string', example: 'SALES' },
                    active: { type: 'boolean', example: true },
                    designation: { type: 'string', example: 'Sales Executive' }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/auth/change-password': {
      put: {
        summary: 'Change User Password',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['oldPassword', 'newPassword'],
                properties: {
                  oldPassword: { type: 'string', example: 'password123' },
                  newPassword: { type: 'string', example: 'newsecurepassword123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Password updated successfully' },
          400: { description: 'Validation failed or current password incorrect' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout User',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Cleared session cookies successfully' }
        }
      }
    },
    '/users': {
      get: {
        summary: 'List All Staff Users',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 3 },
                      name: { type: 'string', example: 'Ramesh Chaudhary' },
                      email: { type: 'string', example: 'ramesh.chaudhary@alphabett.demo' },
                      role: { type: 'string', example: 'SALES' },
                      active: { type: 'boolean', example: true },
                      designation: { type: 'string', example: 'Sales Executive' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Register New Staff User (ADMIN only)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'role'],
                properties: {
                  name: { type: 'string', example: 'Binod Shrestha' },
                  email: { type: 'string', format: 'email', example: 'binod.shrestha@alphabett.demo' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'SALES'], example: 'SALES' },
                  designation: { type: 'string', example: 'Sales Executive' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Created successfully' },
          403: { description: 'Forbidden (ADMIN only)' }
        }
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get Staff Profile Details',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Profile details returned' },
          404: { description: 'Staff not found' }
        }
      },
      put: {
        summary: 'Update Staff Profile Details (ADMIN/MANAGER only)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Ramesh Chaudhary' },
                  email: { type: 'string', example: 'ramesh.chaudhary@alphabett.demo' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'SALES'], example: 'SALES' },
                  active: { type: 'boolean', example: true },
                  designation: { type: 'string', example: 'Senior Sales Executive' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          403: { description: 'Forbidden (ADMIN/MANAGER only)' }
        }
      }
    },
    '/leads': {
      get: {
        summary: 'Query Leads / Calendar Items',
        description: 'Lists all leads with options for status filters, search queries, and page sizing (e.g. size=500 for calendar/pipeline).',
        tags: ['Leads'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', description: 'Search term for school, contact, or phone', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['NEW_LEAD', 'IN_PROGRESS', 'LIKELY_WARM', 'CONVERTED', 'NOT_INTERESTED', 'ON_HOLD'] } },
          { name: 'page', in: 'query', description: '0-based page number', schema: { type: 'integer', default: 0 } },
          { name: 'size', in: 'query', description: 'Page size limit', schema: { type: 'integer', default: 25 } }
        ],
        responses: {
          200: {
            description: 'Paginated results matching Next.js list page expectations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    content: { type: 'array', items: { type: 'object' } },
                    totalElements: { type: 'integer', example: 155 },
                    totalPages: { type: 'integer', example: 7 },
                    number: { type: 'integer', example: 0 },
                    size: { type: 'integer', example: 25 }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Add New Lead opportunity',
        tags: ['Leads'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['organizationName'],
                properties: {
                  organizationName: { type: 'string', example: 'Lincoln School' },
                  contactName: { type: 'string', example: 'John Doe' },
                  designation: { type: 'string', example: 'Director' },
                  phone: { type: 'string', example: '9851023456' },
                  email: { type: 'string', format: 'email', example: 'director@lincoln.edu.np' },
                  province: { type: 'string', example: 'Bagmati Province' },
                  district: { type: 'string', example: 'Kathmandu' },
                  source: { type: 'string', example: 'Referral' },
                  leadType: { type: 'string', example: 'Outbound Outreach' },
                  priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], example: 'HIGH' },
                  status: { type: 'string', enum: ['NEW_LEAD', 'IN_PROGRESS', 'LIKELY_WARM', 'CONVERTED', 'NOT_INTERESTED', 'ON_HOLD'], example: 'NEW_LEAD' },
                  nextActionDate: { type: 'string', format: 'date', description: 'YYYY-MM-DD format', example: '2026-08-30' },
                  notes: { type: 'string', example: 'Very interested in ERP features.' },
                  assignedToId: { type: 'integer', description: 'Assign to user ID', example: 3 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Lead created successfully' }
        }
      }
    },
    '/leads/{id}': {
      get: {
        summary: 'Get Lead details',
        tags: ['Leads'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Lead details with nested activities' }
        }
      },
      put: {
        summary: 'Update Lead details / Change Stage / Assign owner',
        tags: ['Leads'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  organizationName: { type: 'string' },
                  contactName: { type: 'string' },
                  designation: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  province: { type: 'string' },
                  district: { type: 'string' },
                  source: { type: 'string' },
                  leadType: { type: 'string' },
                  priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                  status: { type: 'string', enum: ['NEW_LEAD', 'IN_PROGRESS', 'LIKELY_WARM', 'CONVERTED', 'NOT_INTERESTED', 'ON_HOLD'] },
                  nextActionDate: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                  assignedToId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Updated successfully' },
          403: { description: 'Forbidden (SALES role can only update assigned leads)' }
        }
      }
    },
    '/leads/{id}/activities': {
      post: {
        summary: 'Log Follow-up Activity / Meeting details',
        tags: ['Leads'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['CALL', 'EMAIL', 'PHYSICAL_MEETING', 'ONLINE_MEETING', 'WHATSAPP_SMS', 'NOTE'], example: 'CALL' },
                  remarks: { type: 'string', example: 'Called coordinate office. Setup intro demo.' },
                  occurredAt: { type: 'string', format: 'date', example: '2026-08-17' },
                  nextActionDate: { type: 'string', format: 'date', example: '2026-08-24' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Activity logged successfully' }
        }
      }
    },
    '/staff/leaderboard': {
      get: {
        summary: 'Monthly Team Leaderboard Performance Rankings',
        tags: ['Staff Performance'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Active sales staff sorted by performance score descending' }
        }
      }
    },
    '/staff/me/work': {
      get: {
        summary: 'Get Logged In Staff Workspace Overview (My Work)',
        tags: ['Staff Performance'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Performance metrics and first 20 due follow-ups' }
        }
      }
    },
    '/staff/{id}/performance': {
      get: {
        summary: 'Get Staff member performance metrics',
        tags: ['Staff Performance'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Computed score and KPI items' }
        }
      }
    },
    '/staff/{id}/target': {
      put: {
        summary: 'Save Staff monthly targets (ADMIN/MANAGER only)',
        tags: ['Staff Performance'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leadTarget: { type: 'integer', example: 25 },
                  followUpTarget: { type: 'integer', example: 45 },
                  meetingTarget: { type: 'integer', example: 12 },
                  conversionTarget: { type: 'integer', example: 5 },
                  revenueTarget: { type: 'integer', example: 0 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Targets updated successfully' }
        }
      }
    },
    '/dashboard': {
      get: {
        summary: 'Get Scoped Dashboard overview metrics',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard metrics, status breakdown, and top 10 due leads' }
        }
      }
    },
    '/notifications': {
      get: {
        summary: 'Get Action Item Notifications / Overdue / Due Today / Stale Warnings',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Filtered list of notifications up to 40 items' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token. Format: Bearer <token>'
      }
    }
  }
};

module.exports = swaggerDocument;
