import { discover } from '@/lib/resource-search';
export async function GET(request: Request) {
  return discover(new URL(request.url), { OPENALEX_API_KEY: process.env.OPENALEX_API_KEY });
}
