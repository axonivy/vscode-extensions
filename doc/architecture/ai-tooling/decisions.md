# 🔀 AI Tooling Decisions

### 1. Host tools and MCP in the extension

**Decision:** Host developer-facing AI tools and MCP in the vscode-designer extension, where they can reuse IDE functionality and project context.

**Rejected:** Hosting these tools in the Ivy engine Smart-Core backend. Developer tooling belongs in Designer, and some capabilities may not be available on the engine.

### 2. Vendor-neutral skills

**Decision:** Use skills for shared task guidance across AI harnesses.

**Rejected:** Copilot-specific instructions. They bind guidance to one vendor, while many users appear to prefer Claude Code.

### 3. Preserve prompts

**Decision:** Preserve and test the prompts and use cases behind AI features as a traceable baseline for evaluating models and harnesses.

**Rejected:** Adding untraceable, anecdotal details to skills. Without a clear link to a tested prompt or use case, this guidance can accumulate and bloat skills without evidence that it helps.
