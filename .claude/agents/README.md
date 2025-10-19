# Claude Code Agents

这个目录包含自定义的 Claude Code agent 配置文件。

## 可用的 Agents

### academic-writer

**用途**: 专门用于学术内容写作，包括课程报告、论文等学术文档

**特点**:
- 务实的写作风格，注重清晰度和精确性
- 遵循单一职责原则，每个文档有明确的目的
- 基于证据的论述
- 符合学术规范和标准

**使用方式**:

在与 Claude Code 对话时，使用 Task 工具调用此 agent：

```typescript
// 示例：让 academic-writer agent 帮你写课程报告
Task tool with parameters:
{
  "subagent_type": "academic-writer",
  "description": "写数据库课程报告",
  "prompt": "帮我写一份关于关系型数据库设计的课程报告，包括范式化理论和实际案例分析"
}
```

**适用场景**:
- 撰写课程报告
- 撰写研究论文
- 撰写技术文档
- 文献综述
- 学术演讲稿

**配置文件**: `.claude/agents/academic-writer.md`

## 如何创建新的 Agent

1. 在 `.claude/agents/` 目录下创建一个新的 markdown 文件
2. 文件名使用 kebab-case 命名（如 `my-agent.md`）
3. 在文件中定义 agent 的职责、原则和工作方式
4. 通过 Task tool 调用，使用文件名（不含扩展名）作为 `subagent_type`

## Agent 配置文件结构

一个好的 agent 配置文件应包含：

- **角色定义**: agent 的专业领域和职责
- **核心原则**: agent 遵循的基本准则
- **工作标准**: 具体的质量要求和规范
- **输出格式**: 期望的输出形式
- **交互方式**: 如何与用户互动

参考 `academic-writer.md` 作为模板。
