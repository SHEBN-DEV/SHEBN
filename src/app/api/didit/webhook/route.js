import { NextResponse } from 'next/server';
import { didit } from '../../../lib/didit/client';

export async function POST(request) {
  const signature = request.headers.get('x-didit-signature');
  const payload = await request.json();

  if (!didit.verifyWebhook(signature, payload)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Procesar eventos según tipo
  switch (payload.event) {
    case 'verification.completed':
      // Lógica para verificación completada
      break;
    case 'verification.declined':
      // Lógica para verificación rechazada
      break;
  }

  return NextResponse.json({ success: true });
}