import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";
import { getLegalPageContent } from "../lib/legalPageContent";

const SITE_ORIGIN = "https://mdto.page";
const content = getLegalPageContent("privacy", "en");

export const Route = createFileRoute("/privacy")({
	head: () => ({
		meta: [
			{ title: content.headTitle },
			{
				name: "description",
				content: content.metaDescription,
			},
		],
		links: [{ rel: "canonical", href: `${SITE_ORIGIN}/privacy` }],
	}),
	component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
	return <LegalPage page="privacy" />;
}
