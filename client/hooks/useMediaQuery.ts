import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQueryList = window.matchMedia(query);

		const updateMatches = () => {
			setMatches(mediaQueryList.matches);
		};

		updateMatches();
		if (typeof mediaQueryList.addEventListener === "function") {
			mediaQueryList.addEventListener("change", updateMatches);
		} else {
			mediaQueryList.addListener(updateMatches);
		}

		return () => {
			if (typeof mediaQueryList.removeEventListener === "function") {
				mediaQueryList.removeEventListener("change", updateMatches);
			} else {
				mediaQueryList.removeListener(updateMatches);
			}
		};
	}, [query]);

	return matches;
}
