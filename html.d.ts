/**
 * Type declaration for HTML file imports
 * Wrangler treats .html files as Text modules, which are imported as strings
 */
declare module "*.html" {
	const content: string;
	export default content;
}
