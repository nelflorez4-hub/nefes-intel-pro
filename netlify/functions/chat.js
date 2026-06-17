const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key no configurada' }) }
  }

  try {
    const body = JSON.parse(event.body)

    // Agregar web_search tool para información en tiempo real
    const requestBody = JSON.stringify({
      ...body,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ]
    })

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            // Extraer solo bloques de texto de la respuesta (ignorar tool_use/tool_result)
            const textBlocks = (parsed.content || []).filter(b => b.type === 'text')
            const reply = textBlocks.map(b => b.text).join('\n')
            resolve({
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({
                content: [{ type: 'text', text: reply || 'Sin respuesta.' }]
              })
            })
          } catch(e) {
            resolve({
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: data
            })
          }
        })
      })
      req.on('error', (e) => {
        resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) })
      })
      req.write(requestBody)
      req.end()
    })
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
