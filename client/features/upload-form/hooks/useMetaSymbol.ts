import { useEffect, useState } from "react";

export function useMetaSymbol() {
	const [metaSymbol, setMetaSymbol] = useState("Ctrl");

	useEffect(() => {
		const isMac = /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || "");
		setMetaSymbol(isMac ? "Cmd" : "Ctrl");
	}, []);

	return metaSymbol;
}
