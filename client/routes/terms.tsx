import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";
import { getLegalPageContent } from "../lib/legalPageContent";

const SITE_ORIGIN = "https://mdto.page";
const content = getLegalPageContent("terms", "en");

export const Route = createFileRoute("/terms")({
	head: () => ({
		meta: [
			{ title: content.headTitle },
			{
				name: "description",
				content: content.metaDescription,
			},
		],
		links: [{ rel: "canonical", href: `${SITE_ORIGIN}/terms` }],
	}),
	component: TermsOfServicePage,
});

function TermsOfServicePage() {
	return <LegalPage page="terms" />;
}
