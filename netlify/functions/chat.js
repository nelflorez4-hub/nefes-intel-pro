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
        catch(e) { reject(new Error('Parse error: ' + data.slice(0, 300))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Timeout')); });
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

    // Llamada con web_search tool
    const request = {
      model: body.model || 'claude-sonnet-4-6',
      max_tokens: body.max_tokens || 2048,
      system: body.system,
      messages: body.messages,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }]
    };

    let response = await callClaude(request, apiKey);

    // Si hay error de API, devolverlo visible
    if (response.error) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          content: [{ type: 'text', text: `Error API: ${response.error.type} — ${response.error.message}` }]
        })
      };
    }

    // Ciclo tool_use: máximo 3 iteraciones
    let messages = [...body.messages];
    let iterations = 0;

    while (response.stop_reason === 'tool_use' && iterations < 3) {
      iterations++;

      // El contenido del asistente (incluyendo tool_use blocks)
      messages.push({ role: 'assistant', content: response.content });

      // Construir tool_results — la API ya ejecutó la búsqueda, los resultados están en content
      const toolResults = response.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content || '')
        }));

      messages.push({ role: 'user', content: toolResults });

      response = await callClaude({ ...request, messages }, apiKey);

      if (response.error) break;
    }

    // Extraer texto final
    const textBlocks = (response.content || []).filter(b => b.type === 'text');
    const reply = textBlocks.map(b => b.text).join('\n');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: reply || `Sin texto. stop_reason: ${response.stop_reason}` }]
      })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: `Error interno: ${error.message}` }]
      })
    };
  }
};
