export type DiscordAlertPayload = {
	path?: string;
	message: string;
	stack?: string;
	timestamp: string;
};

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}
	return `${value.slice(0, maxLength - 3)}...`;
}

export async function sendDiscordAlert(env: Env, payload: DiscordAlertPayload) {
	const webhookUrl = env.DISCORD_WEBHOOK_URL?.trim();
	if (!webhookUrl) {
		return;
	}

	const header = [
		"Server Error",
		payload.path ? `path=${payload.path}` : null,
	].filter(Boolean);

	const bodyLines = [
		header.join(" | "),
		`time=${payload.timestamp}`,
		`message=${payload.message}`,
		payload.stack ? `stack=${payload.stack}` : null,
	].filter(Boolean);

	const content = truncate(bodyLines.join("\n"), 1900);

	try {
		await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({ content }),
		});
	} catch (error) {
		console.error("Failed to send Discord alert", error);
	}
}
