import { supabase } from '@/app/SupabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, full_name, user_name, email } = req.body;

  try {
    await supabase
      .from('profiles')
      .insert([{ id, full_name, user_name, email, estado_verificacion: 'pendiente' }]);

    const response = await fetch(
      `${process.env.NEXT_VERIFICATION_BASE_URL}/workflows/${process.env.VERIFICATION_WORKFLOW_ID}/executions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_reference: id,
          callback_url: process.env.VERIFICATION_CALLBACK_URL,
        }),
      }
    );

    const didit = await response.json();

    if (!didit || !didit.qr_code_url || !didit.id) {
      return res.status(500).json({ error: 'Error iniciando verificación Didit' });
    }

    await supabase
      .from('profiles')
      .update({ qr_url: didit.qr_code_url, didit_id: didit.id })
      .eq('id', id);

    return res.status(200).json({ qr: didit.qr_code_url });
  } catch (err) {
    return res.status(500).json({ error: 'Error al procesar el registro' });
  }
}
