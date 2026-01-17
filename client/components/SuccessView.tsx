import {
	CheckmarkCircle02Icon,
	ExternalLink,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";

interface SuccessViewProps {
	url: string;
	onReset: () => void;
}

export function SuccessView({ url, onReset }: SuccessViewProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [url]);

	return (
		<div className="flex flex-col items-center pt-10 pb-6 px-6 text-center rounded-lg bg-surface animate-fade-in">
			{/* Success Icon */}
			<div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mb-5 shadow-[0_0_0_1px_rgba(70,167,88,0.1)]">
				<HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-6 h-6" />
			</div>

			<h3 className="text-base font-medium text-text-primary mb-2">
				Page Created
			</h3>
			<p className="text-[13px] text-text-tertiary mb-6">
				Your page is now live.
			</p>

			{/* URL Container */}
			<div className="flex w-full gap-2 mb-6">
				<input
					type="text"
					className="flex-1 bg-background border border-border rounded-md px-3 font-sans text-[13px] text-text-secondary outline-none h-9 transition-colors duration-200 focus:border-text-tertiary focus:text-text-primary"
					readOnly
					value={url}
					onClick={(e) => e.currentTarget.select()}
				/>
				<button
					type="button"
					className={`
						h-9 px-3 bg-surface-highlight border border-border rounded-md text-text-primary text-[13px] font-medium
						cursor-pointer transition-all duration-200 whitespace-nowrap
						hover:bg-[#25262a] hover:border-text-tertiary
						active:scale-[0.98]
						${copied ? "text-success border-success/30" : ""}
					`}
					onClick={handleCopy}
				>
					{copied ? "Copied!" : "Copy"}
				</button>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="w-9 h-9 p-0 flex items-center justify-center bg-surface-highlight border border-border rounded-md text-text-secondary cursor-pointer transition-all duration-200 no-underline hover:bg-[#25262a] hover:border-text-tertiary hover:text-text-primary"
					title="Open Link"
				>
					<HugeiconsIcon icon={ExternalLink} className="w-4 h-4" />
				</a>
			</div>

			{/* Action Row */}
			<div className="w-full border-t border-border pt-5 flex justify-center">
				<button
					type="button"
					className="
						bg-transparent border border-border text-text-secondary
						py-2.5 px-5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200
						flex items-center justify-center gap-2
						hover:bg-surface-highlight hover:border-text-tertiary hover:text-text-primary hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)]
					"
					onClick={onReset}
				>
					Create another page
				</button>
			</div>
		</div>
	);
}
