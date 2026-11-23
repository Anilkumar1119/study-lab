import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite','postgres'],
  outputFileTracingIncludes: { '/*': ['./db/schema.sql'] }
};
export default config;
