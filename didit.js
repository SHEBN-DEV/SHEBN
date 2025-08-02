import crypto from 'crypto';
import getRawBody from 'raw-body';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-didit-signature'];
    const secret = process.env.WEBHOOK_SECRET_KEY;

    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== hash) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    const payload = JSON.parse(rawBody.toString('utf-8'));
    const { event_type, data } = payload;

    if (event_type === 'verification.completed') {
      const userId = data.user_reference; // ID interno de tu app (UUID de Supabase)
      const genero = data.gender?.toLowerCase(); // Asegúrate que este campo exista
      const estado = genero === 'female' || genero === 'femenino' ? 'approved' : 'rechazado';

      await supabase
        .from('profiles')
        .update({
          estado_verificacion: estado,
          genero: genero,
        })
        .eq('id', userId);

      console.log(`Verificación completada: ${userId} (${genero}) → ${estado}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error en webhook Didit:', err);
    return res.status(500).json({ error: 'Error procesando el webhook' });
  }
}
