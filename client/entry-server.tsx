import * as React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import "./styles.css";

export function render(): string {
	return renderToString(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);
}
