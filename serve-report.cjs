const http = require('http')
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'ai-context-report.html')

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  fs.createReadStream(file).pipe(res)
}).listen(4444, () => {
  console.log('Serving report on http://localhost:4444')
})
