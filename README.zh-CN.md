# Jelly Cursor 中文说明

Jelly Cursor 是一个为 VS Code 添加果冻感动画光标的扩展。它会跟随 Monaco 编辑器的原生光标位置，在移动时产生平滑动画、果冻形变和可选辉光，并尽量镜像 VS Code/Vim 模式下的条形光标、块状光标等形态。

## 功能

- 平滑光标移动
- 根据移动方向产生果冻形变
- 移动时可显示辉光
- 可自定义光标颜色和辉光颜色
- 可调节角点速度、形变程度、透明度和辉光强度
- 尽量跟随原生条形/块状光标形态
- 为多光标和分屏编辑器分别维护光标状态

## 重要说明

Jelly Cursor 使用的是实验性的 DOM Patch 方案。VS Code 的稳定扩展 API 不能直接访问 Monaco 编辑器 DOM，因此本扩展的安装命令会修改 VS Code 的 `workbench.html`，并注入一段脚本来绘制动画光标。

因此你需要知道：

- VS Code 可能提示“安装似乎已损坏”。
- VS Code 更新后可能会移除 Patch。
- VS Code 更新后通常需要重新执行安装命令。
- 首次安装会在 `workbench.html` 旁边创建 `workbench.html.jelly-cursor-backup` 备份文件。
- 如果想移除效果，请先执行卸载命令，然后重启 VS Code。

## 安装 Patch

打开命令面板，执行：

```text
Jelly Cursor: Install DOM Patch
```

然后完全重启 VS Code。

## 卸载 Patch

打开命令面板，执行：

```text
Jelly Cursor: Uninstall DOM Patch
```

然后完全重启 VS Code。

## 设置

这些设置会在执行安装 Patch 时写入注入脚本。修改设置后，需要重新执行 `Jelly Cursor: Install DOM Patch`，然后重启 VS Code。

```json
{
  "jellyCursor.cursorColor": "#ffffff",
  "jellyCursor.glowColor": "#ffffff",
  "jellyCursor.glowEnabled": true,
  "jellyCursor.glowOpacity": 0.9,
  "jellyCursor.glowIntensity": 1.8,
  "jellyCursor.glowSize": 18,
  "jellyCursor.fastSpeed": 0.42,
  "jellyCursor.midSpeed": 0.24,
  "jellyCursor.slowSpeed": 0.1,
  "jellyCursor.axisBias": 0.45,
  "jellyCursor.topEdgeBoost": 0.16,
  "jellyCursor.minAlpha": 0.03
}
```

### 动画设置

- `jellyCursor.fastSpeed`：移动方向上的角点速度。
- `jellyCursor.midSpeed`：预留的侧边角点调节值，后续可继续细分算法。
- `jellyCursor.slowSpeed`：移动反方向上的角点速度。
- `jellyCursor.axisBias`：控制速度判断更偏向横竖方向还是对角线方向。
- `jellyCursor.topEdgeBoost`：横向移动时给上边两个点额外速度，让形变更灵活。
- `jellyCursor.minAlpha`：原生光标闪烁时渲染光标的最低透明度。

### 辉光设置

- `jellyCursor.glowEnabled`：开启或关闭移动辉光。
- `jellyCursor.glowColor`：辉光颜色。留空时跟随光标颜色。
- `jellyCursor.glowOpacity`：移动时最大辉光透明度。
- `jellyCursor.glowIntensity`：辉光亮度倍率。
- `jellyCursor.glowSize`：辉光范围，单位为像素。

## 已知限制

- 这不是稳定 VS Code API 实现。
- Patch 依赖 VS Code 当前的 workbench 文件结构。
- 多光标场景目前会读取 Monaco 的可见 cursor 节点，但主要优化对象仍是主编辑光标。
- 注入脚本中的设置不会实时热更新。

## 开发

```powershell
npm install
npm run compile
```

在 Extension Development Host 中运行扩展，执行安装命令并重启 VS Code 后即可测试注入光标。
