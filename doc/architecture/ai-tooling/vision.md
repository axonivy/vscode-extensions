# AI Tooling Vision

## 🎯 Purpose

AI tooling to help developers build Axon Ivy projects using natural language.

## 💡 Principles

- **🥇 Schema first:** Treat JSON and YAML schemas as the primary, broadly reusable description of project data. Improve schemas before adding AI-specific guidance when richer schema information can serve both end users and automated tools.
- **🧰 Built into Designer:** Ship AI tools and skills with the vscode-designer extension. For complex or logic-intensive tasks, expose functionality already implemented in the IDE instead of recreating its logic; the native experience needs no separate tool installation.
- **🌐 Portable, harness-agnostic tooling:** Use vendor-neutral skills for task-specific context and shared interfaces such as MCP to expose Designer capabilities across AI harnesses and models.
- **🪶 Effective with little context:** Optimize for useful outcomes with minimal context overhead. As the authors of the Designer, we teach assistants the project-specific knowledge they need without making them consume large, repetitive instructions.
- **🤝 Aligned with existing workflows:** Do not impose a special development style through AI tooling. Keep guidance focused on Ivy fundamentals and avoid unnecessary friction for developers.
- **💬️ Test real use cases:** Preserve and test the prompts and use cases that motivate AI features. This provides a behavioral reference as models and harnesses evolve, and helps determine whether custom tools or guidance are still needed.

## 🔎 Scope

We optimize Axon Ivy project formats, schemas, and included technologies for use with AI assistants. We maintain the shared AI-facing understanding and Designer capabilities needed to create, understand, and validate Ivy projects.
