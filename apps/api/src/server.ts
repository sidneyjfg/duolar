import { app } from "./app";
import { AppDataSource } from "./config/data-source";
import { env } from "./config/env";

AppDataSource.initialize()
  .then(() => {
    app.listen(env.port);
    console.log(`DuoLar API running on http://localhost:${env.port}/api`);
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
