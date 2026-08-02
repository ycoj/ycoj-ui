[![Lint](https://github.com/TaiRuiQu/tboj-ui/actions/workflows/lint.yml/badge.svg)](https://github.com/TaiRuiQu/tboj-ui/actions/workflows/lint.yml)
[![CodSpeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://app.codspeed.io/ycoj/ycoj-ui?utm_source=badge)

## 项目简介

这是一个大型在线测评系统 (YCOJ) 的前端项目，负责提供用户界面和交互功能。采用 Next.js 框架，实现 SSR 等功能。

项目内置中英文双语。

部分功能基于定制的 Hydro 后端，开源项目链接：[Hydro](https://github.com/hydro-dev/Hydro), [YCOJ](https://github.com/YCOJ/YCOJ)。

## 界面展示

![](https://lvj-img.tboj.cn/img.zshfoj.com/8ff3e4ad1dfa92957afd35f6f45722662caf43b2ba072614a1a6dc9e8eaa5274.png)

![](https://lvj-img.tboj.cn/img.zshfoj.com/78f730bbca3b72ba20db3c89708de8e0d1508dceaf498c1913504e148ea27bf0.png)

## 开源

本项目（前端）采用 MIT 开源协议。后端采用 AGPL-3.0 开源协议。详情见每个项目的 LICENSE 文件。

## LLMs-Ready

对于那些我们希望让 LLM 访问的内容，请为组件添加 `data-llm-visible="true"` 属性：

```html
<div data-llm-visible="true" className="space-y-2">...</div>
```

对于我们希望让 LLM 阅读的文本，请添加 `data-llm-text` 属性：

```html
<p data-llm-text="{blog.title}">{blog.title}</p>
```
