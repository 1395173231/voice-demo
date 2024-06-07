import { NextRequest, NextResponse } from 'next/server';
import cors from '../../../lib/cors';

async function handle(req: NextRequest) {
  let authKey = process.env.VOICE_API_KEY;
  let baseUrl = process.env.VOICE_BASE_URL;
  if (!authKey || !baseUrl) {
    return NextResponse.json({ status: 401, statusText: 'Not authorized, Need config env' });
  }
  const fetchOptions: RequestInit = {
    headers: {
      Authorization: 'Bearer ' + authKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    method: 'POST',
    // @ts-ignore
    duplex: 'half',
    body: req.body,
  };
  console.log(baseUrl);
  let resp = await fetch(`${baseUrl}/voice/get_token`, fetchOptions);
  let result = await resp.json();
  result.url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  return cors(
    req, NextResponse.json(result, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    }));
}

export const POST = handle;
export const GET = handle;

export async function OPTIONS(request: Request) {
  return cors(
    request,
    new Response(null, {
      status: 200,
    }),
  );
}

export const runtime = 'edge';