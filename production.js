/**
 * 生产模式下的服务器入口
 * 使用 NODE_ENV=production node production.js 来启动
 */
process.env.NODE_ENV = 'production';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const http = require('http');
const { setupWebSocketServer } = require('./websocket');

// 调用 generate-manifest.js 生成 manifest.json
function generateManifest() {
  console.log('Generating manifest.json for Docker deployment...');

  try {
    const generateManifestScript = path.join(
      __dirname,
      'scripts',
      'generate-manifest.js'
    );
    require(generateManifestScript);
    console.log('✅ Generated manifest.json with site name: ShihYuTV');
  } catch (error) {
    console.error('❌ Error calling generate-manifest.js:', error);
    throw error;
  }
}

// 生成manifest
generateManifest();

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3000;

// 在生产模式下初始化 Next.js
const app = next({
  dev: false,
  hostname,
  port
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // 统一由 Next.js 处理所有非 upgrade 请求
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 初始化并附加 WebSocket 服务器
  setupWebSocketServer(server);

  // 启动服务器
  server.listen(port, (err) => {
    if (err) throw err;
    console.log('====================================');
    console.log(`✅ Next.js & WebSocket 服务已启动`);
    console.log(`   - HTTP 服务运行在: http://${hostname}:${port}`);
    console.log(`   - WebSocket 服务路径: /ws`);
    console.log('====================================');

    // 设置服务器启动后的任务
    setupServerTasks();
  });
}).catch(err => {
  console.error('❌ Next.js app preparation failed:', err);
  process.exit(1);
});


// 设置服务器启动后的任务
function setupServerTasks() {
  // 每 1 秒轮询一次，直到请求成功
  const TARGET_URL = `http://${process.env.HOSTNAME || 'localhost'}:${process.env.PORT || 3000}/login`;

  const intervalId = setInterval(() => {
    console.log(`Fetching ${TARGET_URL} ...`);

    const req = http.get(TARGET_URL, (res) => {
      // 当返回 2xx 状态码时认为成功，然后停止轮询
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Server is up, stop polling.');
        clearInterval(intervalId);

        setTimeout(() => {
          // 服务器启动后，立即执行一次 cron 任务
          executeCronJob();
        }, 3000);
      }
    });
    
    req.on('error', () => {
      // 忽略轮询错误，继续尝试
    });

    req.setTimeout(2000, () => {
      req.destroy();
    });
  }, 1000);
}

// 执行 cron 任务的函数
function executeCronJob() {
  const cronUrl = `http://${process.env.HOSTNAME || 'localhost'}:${process.env.PORT || 3000}/api/cron`;

  console.log(`Executing cron job: ${cronUrl}`);

  const req = http.get(cronUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Cron job executed successfully:', data);
      } else {
        console.error('Cron job failed:', res.statusCode, data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Error executing cron job:', err);
  });

  req.setTimeout(300000, () => { // 增加超时时间到5分钟
    console.error('Cron job timeout');
    req.destroy();
  });
}
