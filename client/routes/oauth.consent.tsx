import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSignedOAuthQuery } from "../lib/oauthSignedQuery";

export const Route = createFileRoute("/oauth/consent")({
	component: OAuthConsentPage,
});

type ConsentResponse = {
	redirect_uri?: string;
	url?: string;
};

function OAuthConsentPage() {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [oauthQuery, setOauthQuery] = useState("");
	const [requestedScopes, setRequestedScopes] = useState<string[]>([]);
	const [clientId, setClientId] = useState<string | null>(null);

	useEffect(() => {
		const search = window.location.search;
		const searchParams = new URLSearchParams(search);

		setOauthQuery(getSignedOAuthQuery(search));
		setRequestedScopes(
			(searchParams.get("scope") ?? "").split(" ").filter(Boolean),
		);
		setClientId(searchParams.get("client_id"));
	}, []);

	const submitConsent = async (accept: boolean) => {
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/auth/oauth2/consent", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					accept,
					oauth_query: oauthQuery,
				}),
			});
			const payload = (await response.json()) as ConsentResponse;
			if (!response.ok) {
				throw new Error("Failed to process OAuth consent");
			}

			const redirectUrl = payload.redirect_uri ?? payload.url;
			if (!redirectUrl) {
				throw new Error("Missing OAuth redirect URL");
			}

			window.location.assign(redirectUrl);
		} catch (caughtError: unknown) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to process OAuth consent",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
			<div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-dialog">
				<h1 className="text-2xl font-semibold">Authorize mdto access</h1>
				<p className="mt-3 text-sm text-text-secondary">
					Client{" "}
					<span className="font-medium text-text-primary">{clientId}</span> is
					requesting access to your mdto account.
				</p>
				<div className="mt-6 rounded-xl border border-border bg-background px-4 py-4">
					<p className="text-sm font-medium">Requested scopes</p>
					<ul className="mt-3 space-y-2 text-sm text-text-secondary">
						{requestedScopes.map((scope) => (
							<li key={scope}>{scope}</li>
						))}
					</ul>
				</div>
				{error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
				<div className="mt-6 flex flex-col gap-3 sm:flex-row">
					<button
						type="button"
						onClick={() => void submitConsent(false)}
						disabled={isSubmitting}
						className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:bg-background disabled:opacity-60"
					>
						Deny
					</button>
					<button
						type="button"
						onClick={() => void submitConsent(true)}
						disabled={isSubmitting}
						className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-text-primary px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
					>
						Allow
					</button>
				</div>
			</div>
		</main>
	);
}
