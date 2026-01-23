import { useEffect, useState } from "react";
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
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<Turnstile
			className={cn("self-center", token && "hidden")}
			sitekey={import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY}
			appearance="interaction-only"
			theme="dark"
			fixedSize
			onVerify={onVerify}
			onExpire={onExpire}
			onError={onError}
		/>
	);
}
