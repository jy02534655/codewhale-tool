// Skill 流式安装 API 接口

// 通过 SSE 流式安装 skill（返回 EventSource 实例）
export function installFromGithubStream(repoUrl, skillPath, level) {
  // 构造查询参数
  const params = new URLSearchParams({
    repoUrl: repoUrl || '',
    skillPath: skillPath || '',
    level: level || 'global',
  });
  // 返回 EventSource 实例
  return new EventSource('/api/skill/install-github-stream?' + params.toString());
}

// 上传 ZIP 文件流式安装 skill
export function installFromZipStream(formData) {
  // POST multipart，返回 Promise<{success, streamId}>
  return fetch('/api/skill/install-zip-stream', { method: 'POST', body: formData }).then(function (r) { return r.json(); });
}

// 通过 GitHub Tree URL 流式安装 skill（返回 EventSource 实例）
export function installFromGithubTreePath(githubUrl, level, proxyId, tokenId) {
  // 构造查询参数
  const params = new URLSearchParams({
    githubUrl: githubUrl || '',
    level: level || 'global',
  });
  // 附加可选代理和 token
  if (proxyId) params.append('proxyId', proxyId);
  if (tokenId) params.append('tokenId', tokenId);
  // 返回 EventSource 实例
  return new EventSource('/api/skill/install-github-path-stream?' + params.toString());
}
