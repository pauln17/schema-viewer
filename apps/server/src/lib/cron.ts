import cron from "node-cron";

import { prisma } from "./prisma";

// Cleanup Expired Schemas/Tokens Every Day At Midnight
cron.schedule("0 0 * * *", async () => {
    await prisma.schema.deleteMany({
        where: { token: { expiresAt: { lt: new Date() } } },
    });
});
