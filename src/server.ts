
import app from "./app";
import { config } from "./config/config";

const HOST = "0.0.0.0";

const server = app.listen(config.port, HOST, () => {
  console.log(`Climate AI server listening on ${HOST}:${config.port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(
    `Climate AI server failed to start on ${HOST}:${config.port}: ${error.message}`
  );
  process.exitCode = 1;
});