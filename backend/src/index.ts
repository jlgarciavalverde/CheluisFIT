import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const server = app.listen(port, host, () => {
  console.log(`CheluisFIT API running at http://${host}:${port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
