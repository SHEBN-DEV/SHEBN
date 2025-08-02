import { supabase } from '@/app/SupabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos.' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
