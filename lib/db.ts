// Database layer - PostgreSQL via Prisma
// This file provides backward-compatible exports for API routes

import { prisma, parseJson } from './prisma';

export { prisma, parseJson };

// Re-export prisma as default for backward compatibility
export default prisma;
