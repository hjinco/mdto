import { TRPCError } from "@trpc/server";
import type { db as dbType } from "../db/client";
import { isReservedUsername } from "../lib/username";
import { createUserRepo } from "../repositories/user.repo";

type Db = typeof dbType;

const USERNAME_REGEX = /^[a-z0-9_-]{3,32}$/;

function isUniqueNameConstraintError(error: unknown) {
	if (!(error instanceof Error)) return false;
	return /unique constraint failed: user\.name/i.test(error.message);
}

export function createUserService({ db }: { db: Db }) {
	const userRepo = createUserRepo(db);

	return {
		async changeName(user: { id: string; name: string }, rawName: string) {
			const normalized = rawName.trim().toLowerCase();

			if (!USERNAME_REGEX.test(normalized)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Username must be 3-32 characters and only contain lowercase letters, numbers, hyphens, and underscores",
				});
			}

			if (normalized === user.name) {
				return { ok: true as const, name: normalized };
			}

			if (isReservedUsername(normalized)) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Username already exists",
				});
			}

			const existing = await userRepo.findByName(normalized);
			if (existing && existing.id !== user.id) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Username already exists",
				});
			}

			try {
				await userRepo.updateNameById(user.id, normalized);
			} catch (error) {
				if (isUniqueNameConstraintError(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Username already exists",
					});
				}
				throw error;
			}

			return { ok: true as const, name: normalized };
		},
	};
}
