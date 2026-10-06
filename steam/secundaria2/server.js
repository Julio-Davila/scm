'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const types = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.svg':'image/svg+xml',
  '.json':'application/json; charset=utf-8'
};

function serve(req,res){
  let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  if(!file.startsWith(ROOT)){
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Forbidden');
  }
  fs.stat(file,(err,st)=>{
    if(err || !st.isFile()){
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
      return res.end('Not found');
    }
    const ext=path.extname(file).toLowerCase();
    res.writeHead(200,{
      'Content-Type':types[ext] || 'application/octet-stream',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin'
    });
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer(serve).listen(PORT,()=>{
  console.log(`SCM Business & Innovation Fair listo en http://localhost:${PORT}`);
  console.log('Acceso directo: no se requiere clave.');
});
