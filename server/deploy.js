const { execSync } = require('child_process');
const http = require('http');
const axios = require('axios');
const createHandler = require('gitlab-webhook-handler')

// 保存日志
const saveLogger = (option) => {
  return axios.post('http://111.111.111.111:8080/yoursite/loggers', {
    content: option.content,
    publisher: option.publisher,
    env: option.env
  });
}

// 机器消息通知
const botMsg = (option) => {
  return axios.post('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxxxxxxxxxxxxxxxxxxxxxx', {
    msgtype: "markdown",
    markdown: {
      content: `【构建结果通知】 \n
        >构建分支：<font color=\"comment\">${option.env}</font> \n
        >构建时长：<font color=\"comment\">${option.time}</font>秒 \n
        >日志详情：[查看构建日志](http://111.111.111.111:8080/yoursite/loggers/${option.logid})`
    }
  });
}

const pullAndBuildProject = async (env, publisher) => {
  let runCmd = '',
    branchName = '';

  // 分环境构建：
  switch (env) {
    case 'qa': runCmd = 'build:qa'; branchName = "qa"; break;
    case 'stage': runCmd = 'build:stage'; branchName = "stage"; break;
    case 'product': runCmd = 'build'; branchName = "master"; break;
  }

  let t1 = new Date().getTime();

  // 开始构建：
  let info = execSync(`git checkout ${branchName} && git pull && npm install --register=https://registry.npm.taobao.org/ && npm run ${runCmd} `, { cwd: `${env}`, encoding: "utf-8" })

  let t2 = new Date().getTime();

  // 构建耗时：
  let timeSpan = Math.floor((t2 - t1) / 1000) 

  // 保存构建日志：
  let log = await saveLogger({ content: info, publisher: publisher, env: env });

  // TODO 部署的逻辑的可以写在：
  // copy 产物到站点目录
  // ......
  // ......

  // 消息通知：
  botMsg({
    env: env,
    time: timeSpan,
    logid: log.data.id
  });
}


let handler = createHandler({
  path: '/webhook',
  secret: 'xxxxxxxxxxxxxxxxxxxxx'  // webhook的token
})

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404;
    res.end('no such location')
  })
}).listen(5670) // webhook服务端口

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

// 监听tag提交事件
handler.on('tag_push', function (event) {
  //"refs/tags/stage_2209211321"
  // 判断提交环境：
  if (/^refs\/tags\/stage_\d{10}/.test(event.payload.ref)) {
    // 预发环境：
    pullAndBuildProject('stage', event.payload.user_name)
  } else if (/^refs\/tags\/qa_\d{10}/.test(event.payload.ref)) {
    // qa环境：
    pullAndBuildProject('qa', event.payload.user_name)
  } else if (/^refs\/tags\/product_\d{10}/.test(event.payload.ref)) {
    // product环境：
    pullAndBuildProject('product', event.payload.user_name)
  }
})


