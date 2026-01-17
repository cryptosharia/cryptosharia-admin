# Setting up Svelte MCP in Google Antigravity

This guide explains how to configure the Svelte MCP server to enable advanced **Svelte 5** and **SvelteKit** documentation and auto-fixing capabilities within the **Google Antigravity** IDE.

> **IMPORTANT**  
> As of now, January 16, 2026, **Google Antigravity** does **not** support **project-scoped** MCP server configurations. All MCP servers must be configured in the **device-scoped** configuration file to be successfully detected and used by the **Antigravity Agents**.

## Configuration Steps

### 1. Open MCP Servers Menu

In the **Agent** sidebar, click the three dots `...` (More Actions) in the top right corner and select **MCP Servers**.

![Open MCP Servers Menu](https://github.com/user-attachments/assets/70c952b0-ad01-4c09-a542-182a7b29d28e)

### 2. Manage MCP Servers

Inside the **MCP Store** view, click on the **Manage MCP Servers** link located at the top right.

![Manage MCP Servers](https://github.com/user-attachments/assets/bfa4ed70-2db0-46df-b888-2d7de3b971c5)

### 3. Open Raw Configuration

In the **Manage MCP servers** screen, click on the **View raw config** button. This will open your global `mcp_config.json` file in the editor.

![Open Raw Configuration](https://github.com/user-attachments/assets/937822fd-3366-4404-b084-4de2c85163a0)

### 4. Add Svelte MCP Configuration

Add the following configuration to the `mcpServers` object in your `mcp_config.json` file:

```json
{
	"mcpServers": {
		"svelte": {
			"command": "npx",
			"args": ["-y", "@sveltejs/mcp"]
		}
	}
}
```

### 5. Refresh and Enable

Return to the **Manage MCP servers** screen and click the **Refresh** button. You should now see the `svelte` server listed. Ensure it is toggled to **Enabled**.

![Refresh and Enable](https://github.com/user-attachments/assets/7b9b274b-5203-41f1-b664-ab7030f097d1)

---

## Available Tools

Once configured, **Google Antigravity's Agents** will have access to the following tools:

- `list-sections`: Discover available Svelte 5/SvelteKit documentation.
- `get-documentation`: Retrieve full documentation content.
- `svelte-autofixer`: Automatically analyze and suggest fixes for Svelte code.
- `playground-link`: Generate Svelte Playground links for your snippets.
