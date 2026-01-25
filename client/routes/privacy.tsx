import { createFileRoute } from "@tanstack/react-router";

const SITE_ORIGIN = "https://mdto.page";

export const Route = createFileRoute("/privacy")({
	head: () => ({
		meta: [
			{ title: "Privacy Policy – mdto.page" },
			{
				name: "description",
				content:
					"Read the Privacy Policy for mdto.page to understand how we collect, use, and protect your data.",
			},
		],
		links: [{ rel: "canonical", href: `${SITE_ORIGIN}/privacy` }],
	}),
	component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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
						Privacy Policy
					</h1>
					<p className="text-sm text-text-tertiary m-0">
						Last updated:{" "}
						<span className="text-text-secondary">Jan 25, 2026</span>
					</p>
				</div>

				<div className="space-y-12 text-[15px] text-text-secondary leading-relaxed">
					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							1. Information We Collect
						</h2>
						<p className="mb-3">
							We collect information that you strictly provide to us for the
							purpose of using the Service:
						</p>
						<ul className="list-disc pl-5 space-y-2 marker:text-text-tertiary">
							<li>
								<strong className="text-text-primary font-medium">
									Content:
								</strong>{" "}
								The Markdown text and files you upload to be rendered.
							</li>
							<li>
								<strong className="text-text-primary font-medium">
									Account Information:
								</strong>{" "}
								If you choose to sign in (via Github), we collect your email
								address and basic profile information to create and manage your
								account.
							</li>
							<li>
								<strong className="text-text-primary font-medium">
									Usage Data:
								</strong>{" "}
								We may collect anonymous metrics to understand how the Service
								is used and to improve performance.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							2. Data Retention
						</h2>
						<p className="mb-4">
							Our data retention policy differs depending on whether you are
							using the Service as a guest or as a registered user:
						</p>

						<div className="pl-4 border-l border-border space-y-6">
							<div>
								<h3 className="text-sm font-medium text-text-primary mb-1">
									Guest Users (No Login)
								</h3>
								<p>
									Content uploaded without logging in is considered temporary.
									It is stored for a limited period and will be{" "}
									<span className="text-text-primary">
										automatically deleted
									</span>{" "}
									after its expiration time. We do not guarantee permanent
									storage for guest uploads.
								</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-text-primary mb-1">
									Registered Users (Logged In)
								</h3>
								<p>
									Content uploaded while logged in is{" "}
									<span className="text-text-primary">
										retained indefinitely
									</span>
									. Your data is preserved in your dashboard to help you build
									and manage your personal library of pages. This content will
									be kept until you decide to delete it manually.
								</p>
							</div>
						</div>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							3. How We Use Your Information
						</h2>
						<p>
							We use the information we collect solely to provide, maintain, and
							improve the Service. We do not sell your personal data or content
							to third parties. Your uploaded Markdown content is processed for
							the purpose of rendering it into web pages.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							4. Cookies
						</h2>
						<p>
							We use cookies and similar tracking technologies primarily for
							authentication purposes—to keep you logged in. You can instruct
							your browser to refuse all cookies, but you may not be able to use
							the persistent storage features of the Service if you do so.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							5. Data Security
						</h2>
						<p>
							We strive to use commercially acceptable means to protect your
							Personal Data and content. However, remember that no method of
							transmission over the Internet, or method of electronic storage is
							100% secure.
						</p>
					</section>

					<section>
						<h2 className="text-base font-medium text-text-primary mb-3">
							6. Changes to This Privacy Policy
						</h2>
						<p>
							We may update our Privacy Policy from time to time. We will notify
							you of any changes by posting the new Privacy Policy on this page.
							You are advised to review this Privacy Policy periodically for any
							changes.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
