/**
 * @codewhale/server — Skill 安装路由（SSE 流式）
 *
 * 挂载路径: /api/skill
 */

export function registerInstallRoutes(router, skillMgr) {
  /**
   * SSE 桥接工厂
   * 为单个 SSE 连接提供事件发送、进度回调、日志上报和统一完成/失败处理。
   */
  function createInstallSSEBridge(res) {
    let clientConnected = true
    const close = () => {
      clientConnected = false
    }
    const sendSSE = (event, data) => {
      if (!clientConnected) return
      res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n')
    }
    const onProgress = (progress) => {
      sendSSE('progress', progress)
    }
    const onLog = (logEntry) => {
      sendSSE('log', { level: logEntry.level || 'INFO', message: logEntry.message })
    }
    const sendFailure = (message, errorCode) => {
      onLog({ level: 'ERROR', message })
      sendSSE('error', { success: false, message, errorCode })
    }
    const sendComplete = (data) => {
      sendSSE('complete', { success: true, data })
    }
    const end = () => {
      try { res.end() } catch { /* ignore */ }
    }
    return { close, onProgress, onLog, sendFailure, sendComplete, end }
  }

  /**
   * 共享 SSE 配置工具
   * 自动设置 SSE 响应头、创建 bridge、监听连接、统一完成/失败处理。
   */
  async function withSSE(req, res, handler) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    const sse = createInstallSSEBridge(res)
    req.on('close', sse.close)
    try {
      const result = await handler(sse)
      if (result.success) {
        sse.sendComplete(result.data)
      } else {
        sse.sendFailure(result.message, result.errorCode)
      }
    } catch (err) {
      sse.sendFailure(err.message)
    } finally {
      sse.end()
    }
  }

  /** POST /api/skill/install — 统一安装入口（JSON body） */
  router.post('/install', async (req, res) => {
    const streamId = skillMgr.createPendingInstall(req.body)
    res.json({ success: true, streamId })
  })

  /** POST /api/skill/update — 直接更新 skill（JSON body） */
  router.post('/update', async (req, res) => {
    try {
      const streamId = skillMgr.createPendingUpdate(req.body)
      res.json({ success: true, streamId })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  })

  /** GET /api/skill/install/sse/:streamId — 通用 SSE 流式进度 */
  router.get('/install/sse/:streamId', async (req, res) => {
    await withSSE(req, res, async (sse) => {
      // 核心层统一处理：获取 pending、校验存在性、按 skillId 分发 install/update
      return skillMgr.consumePendingInstall(req.params.streamId, sse.onProgress, sse.onLog)
    })
  })
}
