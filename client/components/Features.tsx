import {
	BoardMathIcon,
	CheckListIcon,
	CodeIcon,
	FlowConnectionIcon,
	InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/styles";

export function Features() {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const features = [
		{
			label: t("features.gfmLabel"),
			desc: t("features.gfmDesc"),
			icon: CheckListIcon,
		},
		{
			label: t("features.mathLabel"),
			desc: t("features.mathDesc"),
			icon: BoardMathIcon,
		},
		{
			label: t("features.mermaidLabel"),
			desc: t("features.mermaidDesc"),
			icon: FlowConnectionIcon,
		},
		{
			label: t("features.highlightingLabel"),
			desc: t("features.highlightingDesc"),
			icon: CodeIcon,
		},
	] as const;

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div
			className="relative mt-4 flex justify-center w-full"
			ref={containerRef}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex items-center gap-1.5 px-3 py-1.5 rounded-full",
					"bg-surface-card border border-border/50",
					"text-xs font-medium text-text-tertiary",
					"transition-all duration-200 cursor-pointer",
					"hover:text-text-secondary hover:border-border hover:bg-surface-highlight/50",
					"focus:outline-hidden",
					isOpen && "text-text-primary border-border bg-surface-highlight",
				)}
			>
				<HugeiconsIcon icon={InformationCircleIcon} className="w-3.5 h-3.5" />
				<span>{t("features.markdownSupport")}</span>
			</button>

			<div
				className={cn(
					"absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[320px]",
					"bg-surface-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-xl p-2",
					"grid grid-cols-2 gap-1 z-50",
					"origin-bottom transition-all duration-200 ease-out",
					isOpen
						? "opacity-100 scale-100 translate-y-0"
						: "opacity-0 scale-95 translate-y-2 pointer-events-none",
				)}
			>
				{features.map((item) => (
					<div
						key={item.label}
						className={cn(
							"group relative overflow-hidden rounded-lg border border-transparent bg-transparent p-2.5",
							"transition-all duration-300 hover:bg-surface-highlight hover:border-border/50 cursor-default",
						)}
					>
						<div className="relative z-10 flex flex-col gap-1.5">
							<div className="flex items-center gap-2">
								<HugeiconsIcon
									icon={item.icon}
									className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors"
								/>
								<span className="text-xs font-medium text-text-secondary transition-colors group-hover:text-text-primary">
									{item.label}
								</span>
							</div>
							<span className="text-[10px] text-text-tertiary pl-6">
								{item.desc}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
