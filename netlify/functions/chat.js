const https = require('https');

function callClaude(requestBody, apiKey) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(requestBody);
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key no configurada' }) };
  }

  try {
    const body = JSON.parse(event.body);

    const baseRequest = {
      model: body.model || 'claude-sonnet-4-6',
      max_tokens: body.max_tokens || 2048,
      system: body.system,
      messages: body.messages,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }]
    };

    // Primera llamada
    let response = await callClaude(baseRequest, apiKey);

    // Si Claude usó web_search, hacer la segunda llamada con los resultados
    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < 3) {
      iterations++;

      // Agregar la respuesta del asistente al historial
      const updatedMessages = [
        ...baseRequest.messages,
        { role: 'assistant', content: response.content }
      ];

      // Construir los tool_results para cada tool_use
      const toolResults = response.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: b.content || ''
        }));

      updatedMessages.push({ role: 'user', content: toolResults });

      // Segunda llamada con resultados de búsqueda
      response = await callClaude({
        ...baseRequest,
        messages: updatedMessages
      }, apiKey);
    }

    // Extraer texto final
    const textBlocks = (response.content || []).filter(b => b.type === 'text');
    const reply = textBlocks.map(b => b.text).join('\n') || 'Sin respuesta.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text: reply }] })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
