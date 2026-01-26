import Turnstile from "react-turnstile";

interface TurnstileWidgetProps {
	onVerify: (token: string) => void;
	onExpire: () => void;
	onError: () => void;
}

export function TurnstileWidget({
	onVerify,
	onExpire,
	onError,
}: TurnstileWidgetProps) {
	return (
		<Turnstile
			sitekey={import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY}
			appearance="interaction-only"
			theme="dark"
			onVerify={onVerify}
			onExpire={onExpire}
			onError={onError}
			fixedSize
		/>
	);
}
