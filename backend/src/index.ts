import { app } from "./app.js";
import { configured, env } from "./lib/env.js";

// On Vercel the exported app is used as the handler; locally we listen on PORT.
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`AH Clothing Hub API → http://localhost:${env.PORT}`);
    console.log("Configured:", configured);
  });
}

export default app;
