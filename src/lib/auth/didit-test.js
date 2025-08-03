/**
 * Archivo de prueba para identificar el formato correcto de URL de Didit
 * Este archivo nos ayudará a encontrar la URL que funciona
 */

export async function testDiditUrls(email) {
  const sessionId = `shebn_${Date.now()}`;
  const apiKey = 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
  const callbackUrl = 'https://shebn.vercel.app/auth/register/callback';
  
  const testUrls = [
    {
      name: 'API Session Creation',
      url: 'https://api.didit.me/v1/sessions',
      method: 'POST',
      body: {
        session_id: sessionId,
        workflow_id: 'shebn',
        callback_url: callbackUrl,
        user_data: email
      }
    },
    {
      name: 'Verification /verify',
      url: `https://verification.didit.me/verify?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
      method: 'GET'
    },
    {
      name: 'Verification /v2/session',
      url: `https://verification.didit.me/v2/session?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
      method: 'GET'
    },
    {
      name: 'Verification /session',
      url: `https://verification.didit.me/session?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
      method: 'GET'
    },
    {
      name: 'Verification base URL',
      url: `https://verification.didit.me?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
      method: 'GET'
    }
  ];

  console.log('🧪 Probando diferentes formatos de URL de Didit...');
  
  for (const test of testUrls) {
    try {
      console.log(`\n🔍 Probando: ${test.name}`);
      console.log(`URL: ${test.url}`);
      
      if (test.method === 'POST') {
        const response = await fetch(test.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(test.body)
        });
        
        console.log(`Status: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Éxito:', data);
          return { success: true, url: data.verification_url || test.url, method: test.name };
        } else {
          console.log('❌ Error:', response.statusText);
        }
      } else {
        // Para URLs GET, solo verificamos si la URL es válida
        console.log('✅ URL generada correctamente');
        return { success: true, url: test.url, method: test.name };
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  return { success: false, error: 'Ninguna URL funcionó' };
}

export function generateDiditUrl(email, format = 'verify') {
  const sessionId = `shebn_${Date.now()}`;
  const apiKey = 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
  const callbackUrl = 'https://shebn.vercel.app/auth/register/callback';
  
  const formats = {
    verify: `https://verification.didit.me/verify?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
    v2session: `https://verification.didit.me/v2/session?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
    session: `https://verification.didit.me/session?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`,
    base: `https://verification.didit.me?session_id=${sessionId}&api_key=${apiKey}&workflow_id=shebn&callback_url=${encodeURIComponent(callbackUrl)}&user_data=${encodeURIComponent(email)}`
  };
  
  return formats[format] || formats.verify;
} 