export const MCP_PAGE_READ_SCOPE = "mdto:pages:read";
export const MCP_PAGE_WRITE_SCOPE = "mdto:pages:write";
export const MCP_USER_READ_SCOPE = "mdto:user:read";
export const MCP_USER_WRITE_SCOPE = "mdto:user:write";

export const MCP_SCOPES = [
	"openid",
	"profile",
	"email",
	"offline_access",
	MCP_PAGE_READ_SCOPE,
	MCP_PAGE_WRITE_SCOPE,
	MCP_USER_READ_SCOPE,
	MCP_USER_WRITE_SCOPE,
] as const;

export const MCP_PROTOCOL_VERSION = "2025-11-25";
