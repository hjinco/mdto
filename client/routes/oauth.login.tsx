import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "../lib/auth-client";
import { getSignedOAuthQuery } from "../lib/oauthSignedQuery";

export const Route = createFileRoute("/oauth/login")({
	component: OAuthLoginPage,
});

type ContinueResponse = {
	redirect_uri?: string;
	url?: string;
};

function OAuthLoginPage() {
	const { t } = useTranslation();
	const { data: session, isPending } = authClient.useSession();
	const [error, setError] = useState<string | null>(null);
	const [isContinuing, setIsContinuing] = useState(false);
	const [oauthQuery, setOauthQuery] = useState("");

	useEffect(() => {
		setOauthQuery(getSignedOAuthQuery(window.location.search));
	}, []);

	useEffect(() => {
		if (!session?.user || !oauthQuery || isContinuing) {
			return;
		}

		setIsContinuing(true);
		void fetch("/api/auth/oauth2/continue", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				postLogin: true,
				oauth_query: oauthQuery,
			}),
		})
			.then(async (response) => {
				const payload = (await response.json()) as ContinueResponse;
				if (!response.ok) {
					throw new Error(t("oauth.login.errors.continueAuthorization"));
				}

				const redirectUrl = payload.redirect_uri ?? payload.url;
				if (!redirectUrl) {
					throw new Error(t("oauth.login.errors.missingRedirectUrl"));
				}

				window.location.assign(redirectUrl);
			})
			.catch((caughtError: unknown) => {
				setError(
					caughtError instanceof Error
						? caughtError.message
						: t("oauth.login.errors.continueAuthorization"),
				);
				setIsContinuing(false);
			});
	}, [isContinuing, oauthQuery, session?.user, t]);

	const handleGithubLogin = async () => {
		setError(null);
		await authClient.signIn.social({
			provider: "github",
			callbackURL: window.location.href,
		});
	};

	return (
		<main className="min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
			<div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-dialog">
				<h1 className="text-2xl font-semibold">{t("oauth.login.title")}</h1>
				<p className="mt-3 text-sm text-text-secondary">
					{t("oauth.login.description")}
				</p>
				{error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
				{session?.user ? (
					<p className="mt-6 text-sm text-text-secondary">
						{isContinuing
							? t("oauth.login.continuing")
							: t("oauth.login.redirecting")}
					</p>
				) : (
					<button
						type="button"
						onClick={() => void handleGithubLogin()}
						disabled={isPending}
						className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#24292e] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2f363d] disabled:opacity-60"
					>
						{t("oauth.login.continueWithGithub")}
					</button>
				)}
			</div>
		</main>
	);
}
