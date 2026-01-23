import Turnstile from "react-turnstile";
import { cn } from "../utils/styles";

interface TurnstileWidgetProps {
	onVerify: (token: string) => void;
	onExpire: () => void;
	onError: () => void;
	token: string | null;
}

export function TurnstileWidget({
	onVerify,
	onExpire,
	onError,
	token,
}: TurnstileWidgetProps) {
	return (
		<Turnstile
			className={cn("mt-4", token && "hidden")}
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
