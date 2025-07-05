---
title: "Git 提交规范化配置"
meta_title: "Git Conventional Commit - 提交规范"
description: "Git 提交规范化配置说明，使用 Commitizen 和 Commitlint 规范化提交信息，提升代码质量和协作效率。"
date: 2024-04-01T05:00:00Z
image: "git.png"
categories: ["工具"]
author: ""
tags: ["Git", "Commitizen", "Commitlint", "Docker"]
draft: false
nextArticle: ""
---

在软件开发中，规范化的提交信息可以显著提升代码质量和团队协作效率。什么是规范化的提交信息，请参考[**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/)。

为实现 Git 提交信息的规范化，常用的工具有 Commitizen 和 Commitlint。Commitizen 用于生成符合规范的提交信息，而 Commitlint 则用于检查提交信息是否符合规范。本文将介绍两款工具的 Docker 容器化配置以及使用 pkg 打包为二进制程序两种方式。而作为项目子模块安装的的配置方式请参考[**Commitizen**](https://github.com/commitizen/cz-cli) 和 [**Commitlint**](https://commitlint.js.org/guides/getting-started.html)官方提供的方法。

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
docker build --build-arg USER_ID=$(id -u)  --build-arg GROUP_ID=$(id -g) --build-arg USER_NAME=$USER -t commitizen-commitlint -f Dockerfile .
```

### 3. 添加到 Git 钩子

Git 钩子是一些脚本，可以在特定的 Git 事件发生时自动执行。比如commit-msg 钩子可以在提交信息被输入时触发，而 prepare-commit-msg 钩子可以在提交消息准备好后触发。这两个钩子可以帮助我们在提交时自动生成规范的提交信息，并检查提交信息是否符合规范。为了在 Git 提交时自动使用 Commitizen 和 Commitlint，可以在项目中添加 Git 钩子，也可以使用 `git config --global core.hooksPath` 命令设置全局钩子路径，以便所有项目都可以使用不用重复配置。以下是如何配置 Git 钩子以使用 Commitizen 和 Commitlint 的示例。

在项目根目录下创建 .git/hooks/commit-msg 文件，并添加以下内容：

```bash
!/bin/sh

docker run --rm -e FORCE_COLOR=true -v "$(pwd):/repo" commit-tools sh -c 'commitlint -g ~/commitlint.config.js --edit $1 --verbose'
```

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

## 使用 pkg 打包

pkg 是一个可以将 Node.js 应用打包为独立可执行文件的工具。使用 pkg 可以将 Commitizen 和 Commitlint 打包为二进制程序，方便在没有 Node.js 环境的机器上运行。ncc 是一个用于将 Node.js 应用打包为单个文件的工具，适合用于打包小型应用或脚本。

### 1. 安装打包环境

首先，确保您的系统上安装了 Node.js 和 npm。然后全局安装 pkg 和 ncc：

```bash
npm install -g pkg @vercel/ncc
```

分别创建 commitizen 和 commitlint 文件夹用于后期打包

### 2. 打包 commitizen 

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
  "config": {
    "commitizen": {
      "path": "/snapshot/commitizen/node_modules/cz-conventional-changelog"
    }
  }
}
```

其中的路径和 targets 需要根据实际情况进行调整。这里的 path 路径 /snapshot/commitizen/node_modules/cz-conventional-changelog 是因为 pkg 打包后，所有的依赖都会被打包到 /snapshot/commitizen 目录下。-t 指定了打包后的目标平台和架构，这里使用的是 node18-linux-x64，表示打包为 Node.js 18 版本的 Linux x64 架构。

#### 打包

在 commitizen 文件夹中运行以下命令：

```bash
npm install --no-fund
npm run build
```

### 3. 打包 commitlint

最新版本的 commitlint 是 ESM 模块，但是目前 pkg 对 ESM 模块的支持还不完善，因此需要使用旧版本的 commitlint, 最后一个支持 cjm 的版本为18。以下是打包 commitlint 的步骤:

#### 1. 创建 package.json 文件



