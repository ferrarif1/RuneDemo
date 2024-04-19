
## 准备环境

在开始之前，您需要安装项目依赖：

```bash
npm install
```

## 集成 Core-Bitcoin

### 1. 构建 Core-Bitcoin

首先，构建 Core-Bitcoin：

```bash
sh build.sh
```

完成后，您会在项目目录中找到编译后的 Core-Bitcoin。

### 2. 集成到项目中

将编译后的 Core-Bitcoin 放到 `src` 目录下，并使用以下命令将其添加到您的项目中：

```bash
npm install {core-bitcoin的路径}
```

这将在 `package.json` 中添加如下条目：

```json
"@okxweb3/coin-bitcoin": "file:src/coin-bitcoin",
"@okxweb3/crypto-lib": "^1.0.1",
```

### 3. 配置依赖解析

为了确保依赖正确解析，需要修改 `node_modules/react-scripts/config` 中的 `resolve` 配置：

```javascript
fallback: {
  "buffer": require.resolve("buffer/"),
  "stream": require.resolve("stream-browserify")
}
```

此外，为了解决在 Core-Bitcoin 中遇到的 `React Uncaught ReferenceError: Buffer is not defined` 错误，请在出错的文件中添加以下导入：

```javascript
import { Buffer } from 'buffer';
```

## 运行项目

一切就绪后，您可以使用以下命令来启动项目：

```bash
npm start
```
