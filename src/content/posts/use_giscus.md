---
title: 在 Fuwari 中使用 Giscus 评论系统
published: 2025-10-04
publishAt: 2025-10-05T18:20:00
description: Fuwari + Giscus 评论系统
tags:
  - Fuwari
  - Featured
  - Giscus
  - Blog
featured: true
category: 折腾电脑记
draft: false
---

:::poem{title="标题" author="作者"}
这里填写正文
注意：
1. 正常输入文本敲击回车后即可正常渲染出单行
2. 若需要进行分段，可以在段与段中间保留空行，会自动渲染出段落
:::

### 前言

Fuwari 是一个轻量的静态博客框架，而 Giscus 则是基于 GitHub Discussions 的评论系统。将两者结合，可以为你的博客添加一个简洁、无需数据库的评论功能。下面是一份完整的集成指南，亲测两次成功（别问），照着做基本不会踩坑。

---
### 一、准备工作

- 已部署好的 Fuwari 博客（若未部署，可参考这篇：[搭建博客指南](https://nimeblogs.github.io/posts/building_blogs/)）
- 一个 GitHub 账号（当然）
- 一点点耐心（其实不需要太多）

---

### 二、配置 Giscus 评论系统

1. 创建 GitHub 仓库
	- 新建一个 公开仓库，例如命名为 `fuwari-comments`
	- 进入仓库设置 → General → Features，勾选 Discussions

2. 安装 Giscus

	- 访问 [Giscus GitHub App](https://github.com/apps/giscus)，点击安装
	
	![图炸了私信作者](https://s21.ax1x.com/2025/10/04/pVTjbgx.png)
	
	- 授权访问你刚创建的仓库
	
	![图炸了私信作者](https://s21.ax1x.com/2025/10/04/pVTjXDO.png)

3. 获取配置参数

	打开 [Giscus 官网](https://giscus.app/zh-CN)，按如下设置：
	- 语言:  默认（zh-CN）
	- 仓库: 你刚创建的仓库
	
	![](https://s21.ax1x.com/2025/10/04/pVTjH81.png)
	
	- 页面 ↔️ Discussion 映射：默认（pathname）	
	- Discussion 分类：Announcements	
	![](https://s21.ax1x.com/2025/10/04/pVTjOKK.png)
	- 特性（可选）：将评论框放在上方	
	完成后，记下以下两个值：
		- `data-repo-id`（仓库 ID）
		- `data-category-id`（分类 ID）

---
### 三、将 Giscus 集成到 Fuwari

1. 创建组件文件

- 在 Fuwari 项目根目录下，新建文件：

```
src/components/misc/Giscus.astro
```

- 内容如下（已适配主题切换）：

```diff lang="astro"
---
interface Props {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: string;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: 'top' | 'bottom';
  lang?: string;
}

const {
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  reactionsEnabled = true,
  emitMetadata = false,
+  inputPosition = '根据你的设置定 ‘top’ or ‘bottom’',
  lang = 'zh-CN'
} = Astro.props;
---

<div id="giscus-container"></div>

<script define:vars={{ repo, repoId, category, categoryId, mapping, reactionsEnabled, emitMetadata, inputPosition, lang }}>
  function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    const isDark = document.documentElement.classList.contains('dark');
    const theme = isDark ? 'dark' : 'light';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', emitMetadata ? '1' : '0');
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    container.appendChild(script);
  }

  // 监听主题变化
  function updateGiscusTheme() {
    const giscusFrame = document.querySelector('iframe[src*="giscus"]');
    if (giscusFrame) {
      const isDark = document.documentElement.classList.contains('dark');
      const theme = isDark ? 'dark' : 'light';

      giscusFrame.contentWindow.postMessage({
        giscus: {
          setConfig: {
            theme: theme
          }
        }
      }, 'https://giscus.app');
    }
  }

  // 监听DOM变化来检测主题切换
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateGiscusTheme();
      }
    });
  });

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGiscus);
  } else {
    loadGiscus();
  }

  // 开始观察主题变化
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
</script>
```

2. 在文章页面引入组件

打开文件：

```
src/pages/posts/[...slug].astro
```

引入组件：

```diff lang="astro"
<!-- 开头 -->
import path from "node:path";
import License from "@components/misc/License.astro";
import Markdown from "@components/misc/Markdown.astro";
+import Giscus from "../../components/misc/Giscus.astro";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import MainGridLayout from "@layouts/MainGridLayout.astro";
```

```diff lang="astro"
<!-- 中间 -->
            <Markdown class="mb-6 markdown-content onload-animation">
                <Content />
            </Markdown>

            {licenseConfig.enable && <License title={entry.data.title} slug={entry.slug} pubDate={entry.data.published} class="mb-6 rounded-xl license-container onload-animation"></License>}

+            <Giscus
+               repo="你的用户名/仓库名"
+               repoId="仓库ID"
+               category="Announcements"
+               categoryId="分类 ID"
+               lang="语言，默认‘zh-CN’"
+            />
            <br>
```

（上面给了附近的代码，可以自行定位）

---
### 四、部署更新

完成上述步骤后，提交代码：

```bash
git add .
git commit -m "集成 Giscus 评论系统"
git push
```

等待部署完成后，访问任意文章页面，即可看到评论框。

---

### ✅ 完成！

你现在拥有了一个基于 GitHub Discussions 的评论系统，无需数据库、无需登录验证，评论内容直接托管在 GitHub 上，简洁高效。

如需进一步美化样式或添加功能，可继续探索 Giscus 提供的配置项。

---


$\color{#3A3}{\large{finish}}$