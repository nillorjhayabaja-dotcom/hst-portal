import { prisma } from '../prisma.service';

export const gatePassRepository = {
  async getVehicleByPlateNumber(plateNumber: string) {
    return prisma.vehicle.findUnique({ where: { plateNumber } });
  },

  async list(params: {
    skip?: number;
    take?: number;
    status?: string;
    requesterId?: string;
    departmentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    currentUserId?: string;
    userRoles?: string[];
    userDepartmentId?: string;
  } = {}) {
    const where: any = {};

    // Build the AND conditions array
    const andConditions: any[] = [];

    // ROLE-BASED ACCESS CONTROL
    // If user is not super admin, apply visibility filters
    const isSuperAdmin = params.userRoles?.includes('super_admin');
    const isAdmin = params.userRoles?.includes('admin') || isSuperAdmin;
    
    if (!isSuperAdmin && !isAdmin) {
      // Employee: can only see their own requests
      if (params.userRoles?.includes('employee')) {
        andConditions.push({ request: { requesterId: params.currentUserId } });
      }
      // Supervisor/Manager: can see requests where they are recommendedBy or department supervisor
      else if (params.userRoles?.includes('supervisor') || params.userRoles?.includes('manager')) {
        andConditions.push({
          OR: [
            { request: { requesterId: params.currentUserId } }, // Own requests
            { request: { 
              steps: {
                some: {
                  roleId: { in: params.userRoles },
                  status: { in: ['current', 'pending'] }
                }
              }
            }}, // Requests awaiting their approval
          ]
        });
      }
      // GAD: can see requests requiring GAD action
      else if (params.userRoles?.includes('gad')) {
        andConditions.push({
          request: {
            steps: {
              some: {
                roleId: { in: params.userRoles },
                status: { in: ['current', 'pending'] }
              }
            }
          }
        });
      }
      // Security: can see approved requests
      else if (params.userRoles?.includes('security')) {
        andConditions.push({ request: { status: 'approved' } });
      }
      // HR: can see requests where HR is part of workflow
      else if (params.userRoles?.includes('hr')) {
        andConditions.push({
          request: {
            steps: {
              some: {
                roleId: { in: params.userRoles }
              }
            }
          }
        });
      }
      // Executive: can see requests assigned to Executive approval
      else if (params.userRoles?.includes('executive')) {
        andConditions.push({
          request: {
            steps: {
              some: {
                roleId: { in: params.userRoles },
                status: { in: ['current', 'pending'] }
              }
            }
          }
        });
      }
    }

    // Build request relation filter
    const requestFilter: any = {};
    if (params.status) requestFilter.status = params.status;
    if (params.requesterId) requestFilter.requesterId = params.requesterId;
    if (params.departmentId) requestFilter.departmentId = params.departmentId;

    if (Object.keys(requestFilter).length > 0) {
      andConditions.push({ request: requestFilter });
    }

    // Add search conditions
    if (params.search) {
      andConditions.push({
        OR: [
          { purpose: { contains: params.search, mode: 'insensitive' } },
          { destination: { contains: params.search, mode: 'insensitive' } },
          { driverName: { contains: params.search, mode: 'insensitive' } },
          { request: { controlNumber: { contains: params.search, mode: 'insensitive' } } },
          { request: { title: { contains: params.search, mode: 'insensitive' } } },
        ]
      });
    }

    // Apply AND conditions if any exist
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [items, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            include: {
              requester: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  employees: {
                    select: {
                      firstName: true,
                      lastName: true,
                      employeeNumber: true,
                      department: {
                        select: { id: true, name: true, code: true }
                      },
                      position: {
                        select: { title: true }
                      }
                    }
                  }
                }
              },
              department: {
                select: { id: true, name: true, code: true }
              },
              steps: {
                orderBy: { stepOrder: 'asc' },
                include: {
                  role: { select: { id: true, name: true } },
                  actor: { select: { id: true, displayName: true } }
                }
              },
              actions: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                  actor: { select: { id: true, displayName: true } }
                }
              }
            }
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
              vehicleType: true
            }
          }
        },
      }),
      prisma.gatePass.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.gatePass.findUnique({
      where: { id },
      include: {
        request: {
          include: {
              requester: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  employees: {
                    select: {
                      firstName: true,
                      lastName: true,
                      employeeNumber: true,
                      department: { select: { name: true, code: true } },
                      position: { select: { title: true } }
                    }
                  }
                }
              },
            department: { select: { id: true, name: true, code: true } },
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: {
                role: { select: { id: true, name: true } },
                actor: { select: { id: true, displayName: true } }
              }
            },
            actions: {
              include: {
                actor: { select: { id: true, displayName: true } }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        vehicle: true,
      },
    });
  },

  async findByRequestId(requestId: string) {
    return prisma.gatePass.findUnique({
      where: { requestId },
      select: {
        id: true,
        requestId: true,
        purpose: true,
        destination: true,
        transportation: true,
        plateNumber: true,
        driverName: true,
        expectedReturn: true,
        approvalStage: true,
        qrCode: true,
        qrToken: true,
        qrGeneratedAt: true,
        expiresAt: true,
        isUsed: true,
        isVerified: true,
        verifiedAt: true,
        verifiedBy: true,
        securityReleasedAt: true,
        securityReleasedBy: true,
        actualReturn: true,
        printCount: true,
        createdAt: true,
        updatedAt: true,
        request: {
          select: {
            id: true,
            controlNumber: true,
            status: true,
            title: true,
            submittedAt: true,
            completedAt: true,
            requesterId: true,
            requester: {
              select: {
                id: true,
                displayName: true,
                email: true,
                employees: {
                  select: {
                    firstName: true,
                    lastName: true,
                    employeeNumber: true,
                    department: { select: { name: true, code: true } },
                    position: { select: { title: true } }
                  }
                }
              }
            },
            department: { select: { id: true, name: true, code: true } },
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
            vehicleType: true
          }
        }
      },
    });
  },

  async create(data: {
    requestId: string;
    purpose: string;
    transportation?: string;
    vehicleId?: string;
    plateNumber?: string;
    driverName?: string;
    items?: any;
    destination?: string;
    expectedReturn?: Date;
  }) {
    const { vehicleId, ...rest } = data;

    // Guard against FK violation: when a vehicleId is provided, it must exist.
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        // Throwing a generic Error here will be mapped by the global error handler.
        // If you have a dedicated ValidationError mapping, we can switch to that.
        throw new Error(`Invalid vehicleId: Vehicle not found (${vehicleId})`);
      }
    }

    return prisma.gatePass.create({
      data: {
        ...rest,
        ...(vehicleId ? { vehicleId } : {}),
      },
      include: {
        request: true,
        vehicle: true,
      },
    });
  },

  async update(id: string, data: {
    purpose?: string;
    transportation?: string;
    vehicleId?: string;
    driverName?: string;
    items?: any;
    destination?: string;
    expectedReturn?: Date;
    actualReturn?: Date;
    qrCode?: string;
    securityReleasedBy?: string;
    securityReleasedAt?: Date;
    printCount?: number;
  }) {
    return prisma.gatePass.update({
      where: { id },
      data,
      include: {
        request: true,
        vehicle: true,
      },
    });
  },

  async updateByRequestId(requestId: string, data: any) {
    return prisma.gatePass.update({
      where: { requestId },
      data,
      include: {
        request: true,
        vehicle: true,
      },
    });
  },

  async getStats(params: { startDate?: string; endDate?: string; departmentId?: string } = {}) {
    const where: any = {};
    
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params.departmentId) {
      where.request = { departmentId: params.departmentId };
    }

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.gatePass.count({ where }),
      prisma.gatePass.count({
        where: {
          ...where,
          request: { ...where.request, status: { in: ['pending', 'in_review'] } }
        }
      }),
      prisma.gatePass.count({
        where: {
          ...where,
          request: { status: { in: ['approved', 'completed'] } }
        }
      }),
      prisma.gatePass.count({
        where: {
          ...where,
          request: { status: { in: ['rejected', 'returned', 'cancelled'] } }
        }
      }),
    ]);

    return { total, pending, approved, rejected };
  },

  async getActiveGatePasses() {
    return prisma.gatePass.findMany({
      where: {
        request: {
          status: { in: ['pending', 'in_review', 'approved'] }
        }
      },
      include: {
        request: {
          include: {
            requester: {
              select: { displayName: true, employees: { select: { firstName: true, lastName: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
};