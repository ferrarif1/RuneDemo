# RuneDemo
 


运行之前：  
安装依赖：  
`npm install`
集成core-bitcoin：  
1.build core-bitcoin：  
`sh build.sh`后找到core-bitcoin  
2.将编译后的core-bitcoin放到src目录下，然后npm install {core-bitcoin的路径}，之后在package.json中会是这样：  
 `"@okxweb3/coin-bitcoin": "file:src/coin-bitcoin",`  
 `"@okxweb3/crypto-lib": "^1.0.1",`  
3.在node_modules找到node_modules\react-scripts\config，找到`resolve: { }`，添加：  
`fallback: {`  

        `"buffer": require.resolve("buffer/"),`  

        `"stream": require.resolve("stream-browserify")`  

      `}`  
 给runedemo和core-bitcoin分别安装buffer：  
 `npm install buffer`  
 给core-bitcoin中报错React Uncaught ReferenceError: Buffer is not defined的文件添加import {Buffer} from 'buffer';  
  
运行：  
  
`npm start`
