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
        catch(e) { reject(new Error('Parse error: ' + data.slice(0, 500))); }
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

    // Primera llamada SIN web_search — respuesta directa
    const baseRequest = {
      model: body.model || 'claude-sonnet-4-6',
      max_tokens: body.max_tokens || 2048,
      system: body.system,
      messages: body.messages
    };

    const response = await callClaude(baseRequest, apiKey);

    // Extraer texto
    const textBlocks = (response.content || []).filter(b => b.type === 'text');
    const reply = textBlocks.map(b => b.text).join('\n');

    if (!reply) {
      // Devolver debug info si no hay texto
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          content: [{
            type: 'text',
            text: `DEBUG — stop_reason: ${response.stop_reason} | error: ${JSON.stringify(response.error)} | content_types: ${(response.content||[]).map(b=>b.type).join(',')}`
          }]
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text: reply }] })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text: 'ERROR: ' + error.message }] })
    };
  }
};
