[![Lint](https://github.com/TaiRuiQu/tboj-ui/actions/workflows/lint.yml/badge.svg)](https://github.com/TaiRuiQu/tboj-ui/actions/workflows/lint.yml)
[![CodSpeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://app.codspeed.io/ycoj/ycoj-ui?utm_source=badge)

## 项目简介

这是一个大型在线测评系统 (ZYZOJ) 的前端项目，负责提供用户界面和交互功能。采用 Next.js 框架，实现 SSR 等功能。

## LLMs-Ready

对于那些我们希望让 LLM 访问的内容，请为组件添加 `data-llm-visible="true"` 属性：

```html
<div data-llm-visible="true" className="space-y-2">...</div>
```

对于我们希望让 LLM 阅读的文本，请添加 `data-llm-text` 属性：

```html
<p data-llm-text="{blog.title}">{blog.title}</p>
```
