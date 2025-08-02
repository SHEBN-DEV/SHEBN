import { supabase } from '../../../src/app/SupabaseClient';
import crypto from 'crypto';
import getRawBody from 'raw-body';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-didit-signature'];
    const secret = process.env.WEBHOOK_SECRET_KEY;

    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (signature !== hash) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    const payload = JSON.parse(rawBody.toString('utf-8'));
    const { event_type, data } = payload;

    if (event_type === 'verification.completed') {
      const userId = data.user_reference;
      const genero = data.gender?.toLowerCase();
      const estado = genero === 'female' || genero === 'femenino' ? 'approved' : 'rechazado';

      await supabase
        .from('profiles')
        .update({ estado_verificacion: estado, genero })
        .eq('id', userId);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error procesando el webhook' });
  }
}
