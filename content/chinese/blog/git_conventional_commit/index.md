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

本文将介绍如何使用 Commitizen 和 Commitlint 来规范化 Git 提交信息，并提供 Docker 容器化配置以及使用 pkg 打包 Commitizen 和 Commitlint 为二进制程序两种方式。而作为项目子模块安装的的配置方式请参考[**Commitizen**](https://github.com/commitizen/cz-cli) 和 [**Commitlint**](https://commitlint.js.org/guides/getting-started.html)官方提供的方法。

## Docker 容器化配置

使用 Docker 容器化 Commitizen 和 Commitlint，可以在任何支持 Docker 的环境中运行，而无需担心 Node.js 环境的配置问题。

1. 创建 Dockerfile

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache git

RUN npm install -g commitizen cz-conventional-changelog
RUN npm install -g commitlint @commitlint/config-conventional

ARG USER_ID=1000
ARG GROUP_ID=1000
ARG USER_NAME=hidka

RUN addgroup -g ${GROUP_ID} ${USER_NAME} && \
    adduser -D -u ${USER_ID} -G ${USER_NAME} ${USER_NAME}

RUN echo '{"path": "cz-conventional-changelog"}' > /home/${USER_NAME}/.czrc
RUN echo "export default { extends: ['@commitlint/config-conventional'] };" > /home/${USER_NAME}/commitlint.config.js

WORKDIR /repo

USER ${USER_NAME}
```

2. 构建 Docker 镜像

```bash
docker build --build-arg USER_ID=$(id -u)  --build-arg GROUP_ID=$(id -g) --build-arg USER_NAME=$USER -t commitizen-commitlint -f Dockerfile .
```

3. 运行 Docker 容器

```bash
docker run --rm -it -v $(pwd):/repo commitizen-commitlint /
## 5. 使用 pkg 打包 Commitizen 和 Commitlint

可以使用 pkg 将 Node.js 应用打包成可执行文件，方便在没有 Node.js 环境的机器上运行。以下是一个简单的打包示例：

1. 安装 pkg

```bash
npm install -g pkg
```

2. 在 package.json 中添加 pkg 配置

```json
{
  "pkg": {
    "targets": [
      "node14-linux-x64"
    ]
  }
}
```

3. 打包应用

```bash
pkg .
```

# 6. 总结

通过使用 Commitizen 和 Commitlint，团队可以轻松实现 Git 提交信息的规范化，从而提升代码质量和协作效率。同时，借助 Docker 和 pkg 等工具，可以进一步简化开发和部署流程。希望本文能为您在项目中实施 Git 提交规范化提供帮助。
