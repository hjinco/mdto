import { pageRouter } from "./routers/page";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
	upload: uploadRouter,
	page: pageRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;
