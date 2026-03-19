import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getLegalPageContent, type LegalPageId } from "../lib/legalPageContent";

export function LegalPage({ page }: { page: LegalPageId }) {
	const { i18n } = useTranslation();
	const content = getLegalPageContent(
		page,
		i18n.resolvedLanguage ?? i18n.language,
	);

	useEffect(() => {
		document.title = content.headTitle;

		const metaDescription = document.querySelector('meta[name="description"]');
		metaDescription?.setAttribute("content", content.metaDescription);
	}, [content.headTitle, content.metaDescription]);

	return (
		<div className="min-h-screen px-5 py-12 md:py-20 relative z-10">
			<div className="w-full max-w-2xl mx-auto">
				<a
					href="/"
					className="no-underline inline-block mb-10 transition-opacity hover:opacity-80"
				>
					<div className="text-lg font-semibold tracking-[-0.02em] bg-linear-to-b from-white to-[#a0a0a0] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
						mdto.page
					</div>
				</a>

				<div className="flex flex-col gap-3 mb-16">
					<h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] m-0 text-text-primary">
						{content.pageTitle}
					</h1>
					<p className="text-sm text-text-tertiary m-0">
						{content.lastUpdatedLabel}{" "}
						<span className="text-text-secondary">
							{content.lastUpdatedDate}
						</span>
					</p>
				</div>

				<div className="space-y-12 text-[15px] text-text-secondary leading-relaxed">
					{content.sections.map((section) => (
						<section key={section.heading}>
							<h2 className="text-base font-medium text-text-primary mb-3">
								{section.heading}
							</h2>
							{section.paragraphs?.map((paragraph) => (
								<p key={paragraph} className="mb-3">
									{paragraph}
								</p>
							))}
							{section.listItems && section.listItems.length > 0 ? (
								<ul className="list-disc pl-5 space-y-2 marker:text-text-tertiary">
									{section.listItems.map((item) => (
										<li key={`${item.label ?? ""}${item.text}`}>
											{item.label ? (
												<>
													<strong className="text-text-primary font-medium">
														{item.label}
													</strong>{" "}
													{item.text}
												</>
											) : (
												item.text
											)}
										</li>
									))}
								</ul>
							) : null}
							{section.subsections && section.subsections.length > 0 ? (
								<div className="pl-4 border-l border-border space-y-6 mt-4">
									{section.subsections.map((subsection, index) => (
										<div key={`${section.heading}-${index}`}>
											{subsection.heading ? (
												<h3 className="text-sm font-medium text-text-primary mb-1">
													{subsection.heading}
												</h3>
											) : null}
											{subsection.paragraphs.map((paragraph) => (
												<p key={paragraph}>{paragraph}</p>
											))}
										</div>
									))}
								</div>
							) : null}
						</section>
					))}
				</div>
			</div>
		</div>
	);
}
