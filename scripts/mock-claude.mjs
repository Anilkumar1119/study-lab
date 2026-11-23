import { createServer } from 'node:http';

createServer(async (request, response) => {
  const body = JSON.parse(await Array.fromAsync(request).then(parts => Buffer.concat(parts).toString('utf8')));
  const blocks = body.messages[0].content;
  const data = JSON.parse(blocks[0].text);
  if (!blocks.some(block => block.type === 'image' && block.source.media_type === 'image/png')) {
    response.writeHead(400).end('Missing photo');
    return;
  }
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify({ id:'msg_test', type:'message', role:'assistant', content:[{ type:'text',text:JSON.stringify({
    summary:'You explained the direction of change.', question:'Why does adding dissolved carbon dioxide change the pH?',
    misconceptions:[], scores:data.concepts.map(concept=>({concept,score:80}))
  }) }] }));
}).listen(4175, '127.0.0.1');
