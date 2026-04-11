import { lazy, Suspense } from "react";

const Turnstile = lazy(() => import("react-turnstile"));

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
		<Suspense fallback={null}>
			<Turnstile
				sitekey={import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY}
				appearance="interaction-only"
				theme="dark"
				onVerify={onVerify}
				onExpire={onExpire}
				onError={onError}
				fixedSize
			/>
		</Suspense>
	);
}
