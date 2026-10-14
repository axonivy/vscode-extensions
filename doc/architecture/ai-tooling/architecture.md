# 🧩 AI Tooling Architecture

## Overview

Axon Ivy schemas are the source of truth for project formats. Skills route the harness to relevant schemas and tools; tools provide callable Designer functionality.

```mermaid
flowchart LR
    Developer[🧑‍💻️ Developer] --> Prompt[💬️ Prompt]

    subgraph Harnesses[AI harnesses]
        Copilot[Native Copilot Chat]
        ThirdParty[Third-party harness<br/>Claude Code / Copilot CLI]
    end
    Prompt --> Copilot
    Prompt --> ThirdParty

    subgraph Extension[vscode-designer extension]
        Skills[🗡️ Skills<br/>routing guidance + schema IDs]
        Native[Native IDE tool integration]
        Mcp[MCP endpoint<br/>opt-in for third-party harnesses]
        Tools[🛠️ AI tools]
        Native --> Tools
        Mcp --> Tools
        Tools --> DevFunctionality[Designer dev functionality<br/> @ workspace]
    end

    Skills -->|preconfigured context| Copilot
    Skills -->|install or copy| ThirdParty
    Copilot -->|native tool calls| Native
    ThirdParty -->|MCP tool calls| Mcp

    Schemas[(🏅️ Source of truth<br/>Axon Ivy schemas<br/>JSON / YAML)]
    Skills -.->|route via schema ID| Schemas

    classDef keyComponent fill:#fff2cc,stroke:#b26a00,stroke-width:3px,color:#242424
    class Skills,Tools keyComponent
    classDef sourceOfTruth fill:#dff3ea,stroke:#24735c,stroke-width:3px,color:#182d26
    class Schemas sourceOfTruth
```

Native IDE integration and the opt-in MCP endpoint are separate access paths to the same AI tools. Those tools delegate to Designer development functionality operating on the Ivy workspace.

## Harness Integration

- **Native IDE experience:** The extension comes preconfigured with tools and skills for Copilot; no separate tool installation is needed.
- **Third-party harness:** Install or copy the skills into the harness environment. To use tools, enable the extension's local MCP endpoint and configure the harness to connect to it. MCP is disabled by default.

See [AI engineering](../../ai-engineering.md), [Skills](../../skills/skills.md), and [MCP integration](../../mcp/mcp.md) for setup details.
