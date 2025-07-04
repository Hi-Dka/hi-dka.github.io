---
title: "Git 提交规范化：提升代码质量与协作效率"
meta_title: "Git Conventional Commit - 提交信息规范化完全指南"
description: "通过 Commitizen 和 Commitlint 实现 Git 提交规范化，提升代码可读性、自动化发布流程并增强团队协作。包含 Docker 和二进制打包两种便捷配置方案。"
date: 2024-04-01T05:00:00Z
image: "git.png"
categories: ["工具", "开发规范"]
author: ""
tags: ["Git", "Commitizen", "Commitlint", "Docker", "规范化", "最佳实践"]
draft: false
nextArticle: ""
---

在软件开发中，规范化的提交信息可以显著提升代码质量和团队协作效率。什么是规范化的提交信息，请参考[**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/)。

## 为什么需要规范化提交信息？

使用规范化的提交信息有以下几个关键优势：

1. **提高可读性** - 统一格式的提交信息使代码历史更易于理解和追踪
2. **自动化发布** - 可基于提交类型自动生成版本号和更新日志
3. **简化代码审查** - 清晰的提交目的使代码审查更加高效
4. **增强团队协作** - 统一标准降低沟通成本，提高团队效率
5. **方便筛选与查找** - 根据类型（如 feat, fix, docs）快速过滤相关提交

## Conventional Commits 格式示例

符合规范的提交信息通常具有以下格式：

```
<类型>[可选作用域]: <描述>

[可选正文]

[可选脚注]
```

常见提交类型示例：

```
feat: 添加用户登录功能
fix: 修复移动端布局错位问题
docs: 更新API文档
style: 格式化代码样式
refactor: 重构用户认证模块
test: 添加购物车测试用例
chore: 更新构建脚本
```

为实现 Git 提交信息的规范化，常用的工具有 Commitizen 和 Commitlint。Commitizen 用于生成符合规范的提交信息，而 Commitlint 则用于检查提交信息是否符合规范。本文将介绍两款工具的 Docker 容器化配置以及使用 pkg 打包为二进制程序两种方式。而作为项目子模块安装的的配置方式请参考[**Commitizen**](https://github.com/commitizen/cz-cli) 和 [**Commitlint**](https://commitlint.js.org/guides/getting-started.html)官方提供的方法。

## 实现方式对比

以下是三种实现方式的对比：

| 实现方式 | 优势 | 劣势 | 适用场景 |
|---------|------|------|---------|
| **Docker容器** | 无需本地Node环境<br>环境隔离<br>团队统一配置 | 需要Docker环境<br>网络原因可能导致镜像构建失败 | 团队协作<br>CI/CD流水线 |
| **二进制打包** | 无需依赖<br>易于分发<br>启动快速 | 跨平台需单独打包<br>更新需重新打包 | 个人开发<br>无Node环境 |
| **项目安装** | 配置简单<br>易于定制<br>与项目绑定 | 每个项目需单独配置<br>需要Node环境 | 单个项目<br>定制化需求高 |

## Docker 容器化配置

使用 Docker 容器化 Commitizen 和 Commitlint，可以在任何支持 Docker 的环境中运行，而无需担心 Node.js 环境的配置问题。

### 1. Dockerfile 配置

Dockerfile 是一个文本文件，包含了构建 Docker 镜像所需的所有指令。以下是一个示例 Dockerfile，用于配置 Commitizen 和 Commitlint：

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache git

RUN npm install -g commitizen cz-conventional-changelog
RUN npm install -g commitlint @commitlint/config-conventional

ARG USER_ID=1000
ARG GROUP_ID=1000
ARG USER_NAME=username

RUN addgroup -g ${GROUP_ID} ${USER_NAME} && \
    adduser -D -u ${USER_ID} -G ${USER_NAME} ${USER_NAME}

RUN echo '{"path": "cz-conventional-changelog"}' > /home/${USER_NAME}/.czrc
RUN echo "export default { extends: ['@commitlint/config-conventional'] };" > /home/${USER_NAME}/commitlint.config.js

WORKDIR /repo

USER ${USER_NAME}
```

### 2. 构建 Docker 镜像

在项目根目录下创建一个名为 Dockerfile 的文件，并将上述内容复制到该文件中。然后在终端中运行以下命令构建 Docker 镜像：

```bash
docker build --build-arg USER_ID=$(id -u)  --build-arg GROUP_ID=$(id -g) --build-arg USER_NAME=$USER -t commit-tools -f Dockerfile .
```

### 3. 添加到 Git 钩子

Git 钩子是一些脚本，可以在特定的 Git 事件发生时自动执行。比如commit-msg 钩子可以在提交信息被输入时触发，而 prepare-commit-msg 钩子可以在提交消息准备好后触发。这两个钩子可以帮助我们在提交时自动生成规范的提交信息，并检查提交信息是否符合规范。为了在 Git 提交时自动使用 Commitizen 和 Commitlint，可以在项目中添加 Git 钩子，也可以使用 `git config --global core.hooksPath` 命令设置全局钩子路径，以便所有项目都可以使用不用重复配置。以下是如何配置 Git 钩子以使用 Commitizen 和 Commitlint 的示例。

#### commit-msg 钩子

在项目根目录下创建 .git/hooks/commit-msg 文件，并添加以下内容：

```bash
#!/bin/sh

docker run --rm -e FORCE_COLOR=true -v "$(pwd):/repo" commit-tools sh -c 'commitlint -g ~/commitlint.config.js --edit $1 --verbose'
```

#### prepare-commit-msg 钩子

在项目根目录下创建 .git/hooks/prepare-commit-msg 文件，并添加以下内容：

```bash
#!/bin/sh

commit_type="$2"
commit_msg_source="$3"

# 如果没有指定提交类型或提交消息来源，则使用 Commitizen 生成提交信息
if [ -z "$commit_type" ] && [ -z "$commit_msg_source" ]; then
    exec < /dev/tty && docker run -it --rm -v "$(pwd):/repo" commit-tools sh -c 'cz -a --hook'
fi

exit 0
```

## 使用 pkg 打包为二进制程序

pkg 是一个可以将 Node.js 应用打包为独立可执行文件的工具。使用 pkg 可以将 Commitizen 和 Commitlint 打包为二进制程序，方便在没有 Node.js 环境的机器上运行。ncc 是一个用于将 Node.js 应用打包为单个文件的工具，适合用于打包小型应用或脚本。首先，确保您的系统上安装了 Node.js 和 npm。

分别创建 commitizen 和 commitlint 文件夹用于后期打包

### 1. 打包 commitizen 

#### 创建 cli.js 文件

在 commitizen 文件夹中创建一个 cli.js 入口文件，内容如下：

```javascript
// cli.js
const fs = require('fs');
const path = require('path');
const { bootstrap } = require('commitizen/dist/cli/git-cz');

function handleError(error) {
  console.error(error.message || error.toString());
}

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

process.stdin.on('error', handleError);
process.stdout.on('error', handleError);
process.stderr.on('error', handleError);

try {
  bootstrap({
    cliPath: path.dirname(require.resolve('commitizen/package.json'))
  });
} catch (error) {
  handleError(error);
}
```

#### 创建 package.json 文件

在 commitizen 文件夹中创建一个 package.json 文件，内容如下：

```json
{
  "name": "commitizen",
  "version": "1.0.0",
  "scripts": {
    "build": "npx pkg cli.js --public --targets node18-linux-x64 --output dist/cz"
  },
  "devDependencies": {
    "commitizen": "^4.3.1",
    "cz-conventional-changelog": "^3.3.0"
  },

}
```

#### 打包和配置

在 commitizen 文件夹中运行以下命令：

```bash
npm install --no-fund
npm run build
```

在项目目录或者home目录下创建一个 .czrc 文件，内容如下：

```json
{
  "path": "cz-conventional-changelog"
}
```

也可以直接在package.json 中配置adapter 路径，如下:

```json
  "config": {
    "commitizen": {
      "path": "/snapshot/commitizen/node_modules/cz-conventional-changelog"
    }
  }
```
这里的 path 路径 /snapshot/commitizen/node_modules/cz-conventional-changelog 是因为 pkg 打包后，所有的依赖都会被打包到 /snapshot/commitizen 目录下。

### 2. 打包 commitlint

最新版本的 commitlint 是 ESM 模块，但是目前 pkg 对 ESM 模块的支持还不完善，因此需要使用旧版本的 commitlint, 最后一个对 cjs 支持友好的版本为18.6.1。以下是打包 commitlint 的步骤:

#### 创建 cli.js 文件

在 commitlint 文件夹中创建一个 cli.js 入口文件，内容如下：

```javascript
//cli.js
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const cliPath = require.resolve('commitlint/cli');

const child = spawn(process.execPath, [cliPath, ...args], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else if (signal) {
    console.error(`${signal}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
});

child.on('error', (err) => {
  console.error(`${err.message}`);
  process.exit(1);
});
```

#### 创建 package.json 文件

在 commitlint 文件夹中创建一个 package.json 文件，内容如下：

```json
{
  "name": "commitlint",
  "version": "1.0.0",
  "scripts": {
    "build": "npx pkg cli.js --public --targets node18-linux-x64 --output dist/commitlint"
  },
  "devDependencies": {
    "@commitlint/config-conventional": "^18.6.3",
    "commitlint": "^18.6.1"
  }
}
```
#### 打包和配置

在 commitlint 文件夹中运行以下命令：

```bash
npm install --no-fund
npm run build
```

{{< notice "tip" >}}
因为使用的是cjs模块，所以配置文件需要使用 CommonJS 模块格式，或者 yaml 和 json 格式，具体参考官方示例。然后使用 -g 选项指定配置文件路径。
{{< /notice >}}

### 3. Git 钩子配置

git 钩子配置同上面的 Docker 容器化配置类似，只需要将 commit-msg 和 prepare-commit-msg 文件中的 docker run 命令替换为直接调用打包后的二进制文件即可。

#### commit-msg 钩子（二进制版本）

```bash
#!/bin/sh
/path/to/commitlint -g /path/to/commitlint.config.js --edit $1 --verbose
```

#### prepare-commit-msg 钩子（二进制版本）

```bash
#!/bin/sh
commit_type="$2"
commit_msg_source="$3"

if [ -z "$commit_type" ] && [ -z "$commit_msg_source" ]; then
    exec < /dev/tty && /path/to/cz --hook || true
fi

exit 0
```

### 4. 二进制程序使用以及注意事项

打包完成后，可以在 commitizen/dist 和 commitlint/dist 目录下找到生成的二进制文件 cz 和 commitlint。您可以将这些文件复制到任何支持 Linux 的机器上运行。需要注意的是，这些二进制文件是针对特定平台和架构打包的，因此只能在相同的环境中运行。如果需要在其他平台上运行，需要重新打包，并指定相应的 targets。通过以上方式打包得到的二进制程序，使用的是conventional commit 规范的提交信息，如果需要使用其他规范的提交信息，请自定义修改配置文件。

## 常见问题与解决方案

### Docker 容器无法访问 Git 仓库
- **问题**: Docker 容器无法访问 Git 仓库的提交信息
- **解决**: 确保正确映射了 `.git` 目录，例如 `-v "$(pwd)/.git:/repo/.git"`

### 无法交互式使用 Commitizen
- **问题**: 在某些环境中无法交互式使用 Commitizen
- **解决**: 确保正确重定向了终端 `exec < /dev/tty && ...`

### 兼容性问题
- **问题**: 二进制程序在某些系统上运行失败
- **解决**: 针对目标系统重新打包，或使用 Docker 方案

## 结论

规范化 Git 提交信息是提高代码质量和团队协作效率的重要步骤。通过本文介绍的 Docker 容器化和二进制打包两种方式，您可以根据实际需求选择最适合的方案，轻松实现提交信息规范化。这不仅能提升代码历史的可读性，还能促进自动化发布流程，为项目管理带来显著价值。

无论您选择哪种方式，规范化的提交信息都将为您的项目带来长期的收益，特别是在团队规模扩大和项目复杂度增加时。