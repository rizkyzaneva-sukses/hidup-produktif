// Database layer - PostgreSQL via Prisma
// This file provides backward-compatible exports for API routes
// that were previously using sql.js (SQLite)

import { prisma, generateId, parseJson } from './prisma';

export { prisma, generateId, parseJson };

// Re-export prisma as default for backward compatibility
export default prisma;
