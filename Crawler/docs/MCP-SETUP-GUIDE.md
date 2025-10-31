# MCP Setup Guide for AI Assistants

This file provides instructions for Claude Code (and other AI assistants) to help users configure Playwright MCP for browser automation.

---

## 🤖 Instructions for Claude Code (Windows)

When a user asks to set up Playwright MCP or mentions browser automation:

### 1. Locate the Config File

**Windows config file location:**
- Path: `%APPDATA%\Claude\claude_desktop_config.json`
- Full path: `C:\Users\<USERNAME>\AppData\Roaming\Claude\claude_desktop_config.json`

### 2. Check if Config File Exists

Use the Read tool to check if the file exists:

```bash
type "%APPDATA%\Claude\claude_desktop_config.json"
```

### 3. Read Existing Configuration

If file exists, read it to preserve existing MCP servers:

```typescript
// Example existing config
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\some\\path"]
    }
  }
}
```

### 4. Add Playwright MCP Configuration

**If file doesn't exist**, create with:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**If file exists**, merge the configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    // ... keep existing servers ...
  }
}
```

### 5. Write the Configuration

Use the Write tool to update the config file at:
`%APPDATA%\Claude\claude_desktop_config.json`

**IMPORTANT**: Preserve existing MCP servers! Don't overwrite them.

**Windows path example**: `C:\Users\Owner\AppData\Roaming\Claude\claude_desktop_config.json`

### 6. Verify Prerequisites

Check if Node.js is installed:

```bash
node --version
npm --version
```

**If not installed**: Direct user to download from https://nodejs.org/

### 7. Instruct User to Restart (CRITICAL)

**IMPORTANT**: Tell the user they MUST restart Claude Desktop:

```
⚠️ CRITICAL: You must completely QUIT and RESTART Claude Desktop for MCP to work.

Windows: Right-click Claude in system tray → Exit → Reopen app

(Just closing the window is NOT enough!)
```

### 8. Verification Test

After restart, suggest this test command:

```
Test: "Can you open a browser and navigate to example.com?"
```

Expected result: Claude should be able to use:
- `mcp__playwright__browser_navigate`
- `mcp__playwright__browser_snapshot`

### 9. Troubleshooting

If tools not available after restart:

**Check 1**: Verify config file syntax (valid JSON)
**Check 2**: Verify Node.js installed
**Check 3**: Try manual test:

```bash
npx -y @playwright/mcp@latest
# Should start MCP server without errors
```

**Check 4**: Look for error messages in Claude Desktop console/logs

---

## 🎯 Complete Automated Setup Workflow (Windows)

When user requests MCP setup, follow this workflow:

1. **Check Node.js** → Verify prerequisite (`node --version`)
2. **Read config** → Check `%APPDATA%\Claude\claude_desktop_config.json`
3. **Merge config** → Add Playwright MCP, preserve existing servers
4. **Write config** → Update file
5. **Instruct restart** → User must restart Claude Desktop (system tray → Exit)
6. **Verify** → Test with browser command

---

## 📋 Available Playwright MCP Tools

Once configured, these tools become available:

### Navigation & Tabs
- `mcp__playwright__browser_navigate(url)` - Go to URL
- `mcp__playwright__browser_tabs(action, index?)` - Manage tabs (list/new/close/select)
- `mcp__playwright__browser_navigate_back()` - Go back
- `mcp__playwright__browser_close()` - Close browser

### Interaction
- `mcp__playwright__browser_click(element, ref, button?, doubleClick?, modifiers?)` - Click elements
- `mcp__playwright__browser_type(element, ref, text, slowly?, submit?)` - Type text
- `mcp__playwright__browser_fill_form(fields[])` - Fill multiple form fields
- `mcp__playwright__browser_hover(element, ref)` - Hover over elements
- `mcp__playwright__browser_drag(startElement, startRef, endElement, endRef)` - Drag and drop
- `mcp__playwright__browser_press_key(key)` - Press keyboard keys
- `mcp__playwright__browser_select_option(element, ref, values[])` - Select dropdown options

### Inspection
- `mcp__playwright__browser_snapshot()` - **BEST** - Get accessibility tree (faster than screenshot)
- `mcp__playwright__browser_take_screenshot(filename?, fullPage?, element?, ref?, type?)` - Capture screenshots
- `mcp__playwright__browser_evaluate(function, element?, ref?)` - Run JavaScript

### Monitoring
- `mcp__playwright__browser_console_messages(onlyErrors?)` - View console logs
- `mcp__playwright__browser_network_requests()` - View network traffic

### Configuration
- `mcp__playwright__browser_resize(width, height)` - Resize viewport
- `mcp__playwright__browser_wait_for(text?, textGone?, time?)` - Wait for conditions

### File Upload & Dialogs
- `mcp__playwright__browser_file_upload(paths[])` - Upload files
- `mcp__playwright__browser_handle_dialog(accept, promptText?)` - Handle alerts/confirms/prompts

### Installation
- `mcp__playwright__browser_install()` - Install browser binaries

---

## 🔧 Example Automation Workflows

### Workflow 1: Test Local Development Server

```typescript
1. browser_navigate("http://localhost:3000")
2. browser_wait_for(text: "Welcome") // Wait for page load
3. browser_snapshot() // Get page structure
4. browser_take_screenshot(filename: "homepage.png", fullPage: true)
```

### Workflow 2: Responsive Design Testing

```typescript
1. browser_navigate("http://localhost:3000")
2. browser_resize(375, 667) // Mobile
3. browser_take_screenshot("mobile.png")
4. browser_resize(1920, 1080) // Desktop
5. browser_take_screenshot("desktop.png")
```

### Workflow 3: Form Testing

```typescript
1. browser_navigate("http://localhost:3000/contact")
2. browser_fill_form([
     {name: "Email", type: "textbox", ref: "...", value: "test@example.com"},
     {name: "Message", type: "textbox", ref: "...", value: "Test message"}
   ])
3. browser_click(element: "Submit button", ref: "...")
4. browser_wait_for(text: "Success")
```

### Workflow 4: Network Monitoring

```typescript
1. browser_navigate("http://localhost:3000")
2. browser_network_requests() // Check API calls
3. browser_console_messages(onlyErrors: true) // Check for errors
```

---

## ⚠️ Important Notes for AI Assistants

### Best Practices

1. **Always use `browser_snapshot()` first** - Faster and more informative than screenshots
2. **Preserve existing MCP servers** - Don't overwrite user's config
3. **Verify Node.js** - Required for `npx` command
4. **Emphasize restart** - Users often forget this critical step
5. **Test incrementally** - Start simple (navigate) before complex workflows

### Common Mistakes to Avoid

❌ Overwriting existing MCP config
❌ Forgetting to tell user to restart
❌ Not checking Node.js prerequisite
❌ Using screenshots when snapshot would be better
❌ Not waiting for page load before interaction

### Troubleshooting Tips

- **"MCP not available"** → User didn't restart Claude Desktop
- **"npx not found"** → Node.js not installed
- **"Browser not installed"** → Run `browser_install()`
- **"Element not found"** → Use `browser_snapshot()` to get correct element refs
- **"Timeout"** → Add `browser_wait_for()` before interactions

---

## 📝 Template: Add to Project CLAUDE.md

Suggest adding this to user's project documentation:

```markdown
## Browser Automation (MCP Required)

This project uses Playwright MCP for automated browser testing with Claude Code.

### Setup Instructions

**Automatic Setup** (recommended):
Ask Claude Code: "Set up Playwright MCP for browser automation"

**Manual Setup** (Windows):
1. Edit Claude Desktop config file:
   - Location: `%APPDATA%\Claude\claude_desktop_config.json`
   - Example: `C:\Users\YourName\AppData\Roaming\Claude\claude_desktop_config.json`

2. Add this configuration:
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@playwright/mcp@latest"]
       }
     }
   }
   ```

3. **Completely quit and restart Claude Desktop**
   - Windows: Right-click system tray → Exit → Reopen
   - (Not just close window!)

4. Test: "Open http://localhost:3000 and take a snapshot"

### Available Commands

Once configured, you can ask Claude Code to:
- "Test my website at http://localhost:3000"
- "Take screenshots at different screen sizes"
- "Fill out the contact form and test submission"
- "Check for console errors on the homepage"
- "Monitor network requests when loading the page"

### Prerequisites

- Node.js 18+ (for `npx` command)
- Claude Desktop app (MCP not available in web version)
```

---

## 🚀 Quick Reference

### Setup Command for Claude Code

When user says: "Set up MCP" or "Configure browser automation"

**Response template:**

```
I'll help you set up Playwright MCP for browser automation. Let me:

1. Check your operating system
2. Verify Node.js is installed
3. Configure the MCP server
4. Guide you through restart

[Then execute the steps above]

After setup, you'll be able to ask me to:
- Open and test websites
- Take screenshots
- Fill forms
- Test responsive designs
- Monitor network traffic
```

---

## 📚 Additional Resources

- Playwright MCP: https://github.com/microsoft/playwright-mcp
- MCP Specification: https://modelcontextprotocol.io/
- Claude Desktop MCP Docs: https://docs.anthropic.com/claude/docs/model-context-protocol

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Config file exists and has valid JSON
- [ ] Playwright MCP entry added to `mcpServers`
- [ ] Existing MCP servers preserved
- [ ] Node.js installed and accessible
- [ ] User restarted Claude Desktop
- [ ] Browser automation tools available
- [ ] Test command works (navigate + snapshot)

---

**Last Updated**: 2025-10-30
**Version**: 1.0
**Maintainer**: AI Assistant Setup Guide
