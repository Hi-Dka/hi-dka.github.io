---
title: "Git Commit Standardization: Enhancing Code Quality and Collaboration Efficiency"
meta_title: "Git Conventional Commit - Complete Guide to Standardizing Commit Messages"
description: "Implement Git commit standardization through Commitizen and Commitlint to improve code readability, automate release workflows, and enhance team collaboration. Includes both Docker and binary packaging configuration options."
date: 2024-04-01T05:00:00Z
image: "git.png"
categories: ["Tools", "Development Standards"]
author: ""
tags: ["Git", "Commitizen", "Commitlint", "Docker", "Standardization", "Best Practices"]
draft: false
nextArticle: ""
---

In software development, standardized commit messages can significantly improve code quality and team collaboration efficiency. For information about what constitutes standardized commit messages, refer to [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/).

## Why Standardize Commit Messages?

Using standardized commit messages offers several key advantages:

1. **Improved Readability** - Consistent format makes code history easier to understand and track
2. **Automated Releases** - Enables automatic version numbering and changelog generation based on commit types
3. **Streamlined Code Reviews** - Clear commit purposes make code reviews more efficient
4. **Enhanced Team Collaboration** - Unified standards reduce communication overhead and improve team efficiency
5. **Easier Filtering and Searching** - Quickly filter relevant commits by type (e.g., feat, fix, docs)

## Conventional Commits Format Example

Compliant commit messages typically have the following format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Common commit type examples:

```
feat: add user login functionality
fix: resolve mobile layout misalignment
docs: update API documentation
style: format code style
refactor: restructure user authentication module
test: add shopping cart test cases
chore: update build scripts
```

To implement standardized Git commit messages, tools like Commitizen and Commitlint are commonly used. Commitizen helps generate compliant commit messages, while Commitlint checks if commit messages adhere to standards. This article introduces two approaches: Docker containerization and binary packaging using pkg. For project submodule installation configuration, please refer to the official methods provided by [**Commitizen**](https://github.com/commitizen/cz-cli) and [**Commitlint**](https://commitlint.js.org/guides/getting-started.html).

## Implementation Method Comparison

Here's a comparison of three implementation approaches:

| Implementation Method | Advantages | Disadvantages | Suitable Scenarios |
|---------|------|------|---------|
| **Docker Container** | No local Node environment required<br>Environment isolation<br>Unified team configuration | Requires Docker environment<br>Network issues may affect image building | Team collaboration<br>CI/CD pipelines |
| **Binary Packaging** | No dependencies required<br>Easy to distribute<br>Quick startup | Separate packaging needed for cross-platform<br>Updates require repackaging | Individual development<br>No Node environment |
| **Project Installation** | Simple configuration<br>Easy to customize<br>Bound to project | Each project needs separate configuration<br>Node environment required | Single projects<br>High customization needs |

## Docker Container Configuration

Using Docker containers for Commitizen and Commitlint allows running in any Docker-supported environment without worrying about Node.js configuration.

### 1. Dockerfile Configuration

A Dockerfile is a text file containing all instructions needed to build a Docker image. Here's an example Dockerfile for configuring Commitizen and Commitlint:

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

### 2. Building the Docker Image

Create a file named Dockerfile in your project root directory and copy the above content into it. Then run the following command in the terminal to build the Docker image:

```bash
docker build --build-arg USER_ID=$(id -u)  --build-arg GROUP_ID=$(id -g) --build-arg USER_NAME=$USER -t commit-tools -f Dockerfile .
```

### 3. Adding to Git Hooks

Git hooks are scripts that run automatically when specific Git events occur. For example, the commit-msg hook triggers when a commit message is entered, while the prepare-commit-msg hook triggers after a commit message is prepared. These hooks can help automatically generate standardized commit messages and check if commit messages comply with standards. To automatically use Commitizen and Commitlint during Git commits, you can add Git hooks to your project, or use the `git config --global core.hooksPath` command to set a global hooks path for all projects without repetitive configuration. Below are examples of how to configure Git hooks to use Commitizen and Commitlint.

#### commit-msg Hook

Create a .git/hooks/commit-msg file in your project root directory and add the following content:

```bash
#!/bin/sh

docker run --rm -e FORCE_COLOR=true -v "$(pwd):/repo" commit-tools sh -c 'commitlint -g ~/commitlint.config.js --edit $1 --verbose'
```

#### prepare-commit-msg Hook

Create a .git/hooks/prepare-commit-msg file in your project root directory and add the following content:

```bash
#!/bin/sh

commit_type="$2"
commit_msg_source="$3"

# If no commit type or message source is specified, use Commitizen to generate commit message
if [ -z "$commit_type" ] && [ -z "$commit_msg_source" ]; then
    exec < /dev/tty && docker run -it --rm -v "$(pwd):/repo" commit-tools sh -c 'cz -a --hook'
fi

exit 0
```

## Using pkg to Create Binary Executables

pkg is a tool that can package Node.js applications into standalone executable files. Using pkg, we can package Commitizen and Commitlint into binary programs for use on machines without a Node.js environment. ncc is a tool for packaging Node.js applications into single files, suitable for packaging small applications or scripts. First, ensure Node.js and npm are installed on your system.

Create separate folders for commitizen and commitlint for later packaging.

### 1. Packaging Commitizen

#### Create the cli.js File

Create an entry file cli.js in the commitizen folder with the following content:

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

#### Create the package.json File

Create a package.json file in the commitizen folder with the following content:

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

#### Packaging and Configuration

Run the following commands in the commitizen folder:

```bash
npm install --no-fund
npm run build
```

Create a .czrc file in your project directory or home directory with the following content:

```json
{
  "path": "cz-conventional-changelog"
}
```

Alternatively, you can configure the adapter path directly in package.json:

```json
  "config": {
    "commitizen": {
      "path": "/snapshot/commitizen/node_modules/cz-conventional-changelog"
    }
  }
```
The path `/snapshot/commitizen/node_modules/cz-conventional-changelog` is used because after packaging with pkg, all dependencies are packaged into the `/snapshot/commitizen` directory.

### 2. Packaging Commitlint

The latest version of commitlint uses ESM modules, but pkg's support for ESM modules is still limited. Therefore, we need to use an older version of commitlint. The last version with good cjs support is 18.6.1. Here are the steps for packaging commitlint:

#### Create the cli.js File

Create an entry file cli.js in the commitlint folder with the following content:

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

#### Create the package.json File

Create a package.json file in the commitlint folder with the following content:

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

#### Packaging and Configuration

Run the following commands in the commitlint folder:

```bash
npm install --no-fund
npm run build
```

{{< notice "tip" >}}
Since we're using cjs modules, the configuration file needs to use CommonJS module format, or yaml and json formats. See official examples for details. Then use the -g option to specify the configuration file path.
{{< /notice >}}

### 3. Git Hook Configuration

The Git hook configuration is similar to the Docker container configuration above. Just replace the docker run commands in the commit-msg and prepare-commit-msg files with direct calls to the packaged binary files.

#### commit-msg Hook (Binary Version)

```bash
#!/bin/sh
/path/to/commitlint -g /path/to/commitlint.config.js --edit $1 --verbose
```

#### prepare-commit-msg Hook (Binary Version)

```bash
#!/bin/sh
commit_type="$2"
commit_msg_source="$3"

if [ -z "$commit_type" ] && [ -z "$commit_msg_source" ]; then
    exec < /dev/tty && /path/to/cz --hook || true
fi

exit 0
```

### 4. Binary Program Usage and Considerations

After packaging, you can find the generated binary files cz and commitlint in the commitizen/dist and commitlint/dist directories. You can copy these files to any Linux-compatible machine to run them. Note that these binary files are packaged for specific platforms and architectures, so they can only run in the same environment. If you need to run them on other platforms, you'll need to repackage them with the appropriate targets specified. The binary programs packaged using this method use the conventional commit standard. If you need to use other commit message standards, please customize the configuration files.

## Common Issues and Solutions

### Docker Container Cannot Access Git Repository
- **Issue**: Docker container cannot access Git repository commit information
- **Solution**: Ensure the `.git` directory is properly mapped, e.g., `-v "$(pwd)/.git:/repo/.git"`

### Cannot Use Commitizen Interactively
- **Issue**: Cannot use Commitizen interactively in certain environments
- **Solution**: Ensure terminal is properly redirected with `exec < /dev/tty && ...`

### Compatibility Issues
- **Issue**: Binary programs fail to run on certain systems
- **Solution**: Repackage for the target system or use the Docker approach

## Conclusion

Standardizing Git commit messages is an important step in improving code quality and team collaboration efficiency. Through the Docker containerization and binary packaging approaches introduced in this article, you can choose the most suitable solution based on your actual needs to easily implement commit message standardization. This not only enhances the readability of code history but also promotes automated release processes, bringing significant value to project management.

Regardless of which approach you choose, standardized commit messages will bring long-term benefits to your project, especially as team size grows and project complexity increases.