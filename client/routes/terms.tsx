import { createFileRoute } from "@tanstack/react-router";

const SITE_ORIGIN = "https://mdto.page";

export const Route = createFileRoute("/terms")({
	head: () => ({
		meta: [
			{ title: "Terms of Service – mdto.page" },
			{
				name: "description",
				content:
					"Read the Terms of Service for mdto.page regarding the use of our markdown sharing platform.",
			},
		],
		links: [{ rel: "canonical", href: `${SITE_ORIGIN}/terms` }],
	}),
	component: TermsOfServicePage,
});

function TermsOfServicePage() {
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
						Terms of Service
					</h1>
					<p className="text-sm text-text-tertiary m-0">
						Last updated:{" "}
						<span className="text-text-secondary">Jan 25, 2026</span>
					</p>
				</div>

				<div className="space-y-12 text-[15px] text-text-secondary leading-relaxed">
					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							1. Acceptance of Terms
						</h2>
						<p>
							By accessing and using mdto.page ("the Service"), you agree to be
							bound by these Terms of Service. If you do not agree to these
							terms, please do not use the Service. These Terms apply to all
							visitors, users, and others who access or use the Service.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							2. Description of Service
						</h2>
						<p>
							mdto.page provides a platform for users to upload, render, and
							share Markdown files. The Service allows you to convert raw
							Markdown text into visually rendered web pages that can be shared
							with others via a unique URL.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							3. User Conduct and Content
						</h2>
						<p className="mb-3">
							You are solely responsible for the content you upload and share
							through the Service. You represent and warrant that you own or
							have the necessary rights to share any content you upload.
						</p>
						<p>
							You agree not to use the Service to upload, post, host, or
							transmit content that:
						</p>
						<ul className="list-disc pl-5 mt-3 space-y-1.5 marker:text-text-tertiary">
							<li>
								Is unlawful, harmful, threatening, abusive, harassing,
								defamatory, vulgar, obscene, or invasive of another's privacy.
							</li>
							<li>
								Infringes on any patent, trademark, trade secret, copyright, or
								other proprietary rights of any party.
							</li>
							<li>
								Contains software viruses or any other computer code designed to
								interrupt, destroy, or limit the functionality of any computer
								software or hardware.
							</li>
							<li>
								Is intended to mislead recipients as to the origin of the
								content.
							</li>
						</ul>
						<p className="mt-3">
							We reserve the right to remove any content that violates these
							terms or that we find objectionable at our sole discretion.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							4. Intellectual Property
						</h2>
						<p>
							We claim no intellectual property rights over the material you
							provide to the Service. Your profile and materials uploaded remain
							yours. However, by setting your pages to be viewed publicly (which
							is the default nature of the Service), you agree to allow others
							to view your content.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							5. Disclaimer of Warranties
						</h2>
						<p>
							The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
							mdto.page expressly disclaims all warranties of any kind, whether
							express or implied, including, but not limited to, the implied
							warranties of merchantability, fitness for a particular purpose,
							and non-infringement. We make no warranty that the Service will
							meet your requirements, be uninterrupted, timely, secure, or
							error-free.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							6. Limitation of Liability
						</h2>
						<p>
							In no event shall mdto.page, its operators, or affiliates be
							liable for any indirect, incidental, special, consequential, or
							punitive damages, including without limitation, loss of profits,
							data, use, goodwill, or other intangible losses, resulting from
							your access to or use of or inability to access or use the
							Service.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							7. Modifications to Service
						</h2>
						<p>
							We reserve the right to modify or discontinue, temporarily or
							permanently, the Service (or any part thereof) with or without
							notice at any time. We shall not be liable to you or to any third
							party for any modification, suspension, or discontinuance of the
							Service.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							8. Governing Law
						</h2>
						<p>
							These Terms shall be governed and construed in accordance with the
							laws, without regard to its conflict of law provisions. Our
							failure to enforce any right or provision of these Terms will not
							be considered a waiver of those rights.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							9. Changes to Terms
						</h2>
						<p>
							We reserve the right, at our sole discretion, to modify or replace
							these Terms at any time. By continuing to access or use our
							Service after those revisions become effective, you agree to be
							bound by the revised terms.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
