import { pageRouter } from "./routers/page";
import { uploadRouter } from "./routers/upload";
import { router } from "./trpc";

export const appRouter = router({
	upload: uploadRouter,
	page: pageRouter,
});

export type AppRouter = typeof appRouter;
