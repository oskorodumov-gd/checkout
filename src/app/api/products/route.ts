import { catalogue } from "@/lib/catalogue";

export function GET() {
  return Response.json(catalogue);
}

