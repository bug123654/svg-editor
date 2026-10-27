# SVG 命令行编辑器 — Lab1 Phase 1

## 项目信息

- Git 远程仓库：[bug123654/svg-editor](https://github.com/bug123654/svg-editor)。
- 当前状态：开发进度备份，尚未完成全部类型检查、测试和文档自查；不是最终提交，暂未创建 `final` 标签。
- 阶段范围：TypeScript CLI，内置 rect / circle / ellipse / line / text / g；不实现后续阶段的 box 插件。
- 原始需求：[phase_cli_1.md](../phase_cli_1.md)。

## 架构方案（初稿）

- `model`：封装图形行为和文档树，以 Composite 统一容器和叶子。
- `commands`：Command 对象与历史管理；编辑在副本上执行，成功后发布，使用前后快照撤销/重做。
- `application`：文档生命周期、显示、编辑及 IO 协调。
- `io`：SVG 解析/序列化和文件访问，依赖 model。
- `cli`：参数解析和 REPL，通过 application 发起操作。
- `main.ts`：组装依赖。

依赖方向：cli → application → commands/model；application 通过存储接口使用 IO；io → model；model 不依赖其他层。

按命令名分发和按图形名构造是本阶段保留的两处名称分派，列为后续注册机制的重构点。

## 过程记录

1. 初始化时目录仅有原始需求文档。采用 npm.cmd 避免修改 PowerShell 执行策略；依赖和 npm 缓存均保存在项目目录。
2. 先明确阶段边界和模块依赖，再分步实现。选择完整文档快照换取撤销可靠性，代价为每步 O(N) 的时间和存储；当前教学规模接受此取舍。
3. 2026-10-27 恢复开发：修复 XML 库将 `localName` 声明为可空值导致的类型错误，使用 `tagName` 作为回退；完整执行 `npm.cmd run check`，26 项测试、TypeScript 检查及构建通过。此阶段单独提交、推送，再继续验收和文档。

## 一致性自查

待实现完成后根据实际目录、导入关系填写。

## 质量保证手段

将对图形模型、编辑历史、层级顺序、失败原子性、SVG 往返以及真实 CLI 运行进行检查，最终记录实际执行结果。
