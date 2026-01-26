import { useEffect, useState } from "react";

export function useNowTick({ intervalMs }: { intervalMs: number }) {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => {
			setNow(Date.now());
		}, intervalMs);
		return () => {
			clearInterval(id);
		};
	}, [intervalMs]);

	return now;
}
