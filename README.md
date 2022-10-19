## 自动构建部署

### client 端

> 提交代码，打tag，触发 `tag_push` 事件

#### 1、构建命令：
```json
// package.json
{
  "scripts": {
      "pub:qa": "vite build --mode qa && cross-env scene=qa node ./build/index.js",
      "pub:stage": "vite build --mode stage && cross-env scene=stage node ./build/index.js",
      "pub:product": "vite build && cross-env scene=product node ./build/index.js"
  },
}
```

> 项目里需要安装 `cross-env` 模块，用于区分环境

#### 2、打tag、提交代码逻辑在 `/client/build/index.js`

### server 端

> 监听 `tag_push` 事件，根据 `push环境` 执行相应构建命令


#### 1、`gitlab-webhook-handler` 模块监听 `tag_push` 事件

#### 2、构建日志保存

#### 3、企业微信消息通知

#### 4、pm2 服务守卫


