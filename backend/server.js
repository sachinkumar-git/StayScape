const env = require("./src/config/env");
const { connectDatabase, disconnectDatabase } = require("./src/config/database");
const createApp = require("./src/server");

async function start() {
  const connection = await connectDatabase(env.mongoUrl);
  console.log(`[db] Connected to ${connection.host}/${connection.name}`);

  const app = createApp({ mongoClient: connection.getClient() });
  const server = app.listen(env.port, () => {
    console.log(`[server] StayScape running at http://localhost:${env.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
