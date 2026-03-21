import { createServer } from 'http';
import app from './api/index.ts';

const server = createServer(app);
server.listen(4002, () => {
    console.log("Server running on 4002");
    fetch('http://localhost:4002/api/reseller/products')
      .then(r => r.json())
      .then(d => {
        console.log("Response:", JSON.stringify(d, null, 2).slice(0, 500));
        process.exit(0);
      })
      .catch(e => {
        console.error(e);
        process.exit(1);
      });
});
