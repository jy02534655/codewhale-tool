/**
 * API 连通性探测模块
 *
 * 调用各 AI provider 的 /models 端点，验证 API key 有效性并获取可用模型列表。
 * 支持 DeepSeek、OpenAI 及兼容 OpenAI API 格式的其他 provider。
 *
 * @module probe
 */

/**
 * 各 provider 的模型列表端点映射
 *
 * 优先调用 OpenAI 兼容的 /v1/models 端点；
 * DeepSeek 使用自己特定的端点。
 *
 * @type {Record<string, string>}
 */
const PROVIDER_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com/v1/models',
  openai: 'https://api.openai.com/v1/models',
  // 通用回退：尝试标准的 /v1/models
  _default: '/v1/models',
};

/**
 * 探测指定 provider + API key 的连通性，并获取可用模型列表
 *
 * @param {string} providerName - provider 名称（如 "deepseek"）
 * @param {string} apiKey       - 实际的 API key 字符串
 * @param {string} [baseUrl]    - 自定义 API 基础 URL（可选）
 * @returns {Promise<{success: boolean, models?: string[], error?: string, latency_ms?: number}>}
 */
export async function probeProvider(providerName, apiKey, baseUrl) {
  const startTime = Date.now();

  // 构建请求 URL
  let url;
  if (PROVIDER_ENDPOINTS[providerName]) {
    url = PROVIDER_ENDPOINTS[providerName];
  } else if (baseUrl) {
    // 自定义 endpoint：baseUrl + /v1/models
    url = baseUrl.replace(/\/+$/, '') + '/v1/models';
  } else {
    // 无已知端点且无 baseUrl，无法探测
    return { success: false, error: `未知 provider "${providerName}"，且未提供 baseUrl` };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000), // 15 秒超时
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        success: false,
        error: `HTTP ${response.status}: ${body.slice(0, 200)}`,
        latency_ms: latency,
      };
    }

    const data = await response.json();

    // 提取模型 ID 列表
    // OpenAI 格式: { data: [{ id: "gpt-4o" }, ...] }
    let models = [];
    if (Array.isArray(data)) {
      // 某些 endpoint 直接返回数组
      models = data.map((m) => m.id || m.model || m.name || '').filter(Boolean);
    } else if (data.data && Array.isArray(data.data)) {
      // 标准 OpenAI 格式
      models = data.data.map((m) => m.id || '').filter(Boolean);
    }

    return {
      success: true,
      models,
      latency_ms: latency,
    };
  } catch (err) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      error: err.message,
      latency_ms: latency,
    };
  }
}

/**
 * 批量探测多个 provider 的连通性
 *
 * @param {Array<{provider: string, apiKey: string, baseUrl?: string}>} targets - 探测目标列表
 * @returns {Promise<Array<{provider: string, success: boolean, models?: string[], error?: string}>>}
 */
export async function probeMultiple(targets) {
  const results = await Promise.allSettled(
    targets.map((t) =>
      probeProvider(t.provider, t.apiKey, t.baseUrl).then((r) => ({
        provider: t.provider,
        ...r,
      }))
    )
  );

  return results.map((r) => {
    if (r.status === 'fulfilled') return r.value;
    return { provider: 'unknown', success: false, error: r.reason?.message || '未知错误' };
  });
}