/**
 * 通用常量定义
 *
 * 集中管理代码中散落的魔法数字，便于统一调整和提升可读性。
 *
 * @module constants
 */

/**
 * 文件读取最大大小限制（1MB）
 * 防止加载过大的文件导致内存溢出
 */
export const MAX_FILE_SIZE = 1024 * 1024;

/**
 * 下载最大重试次数
 * 网络请求失败时的重试上限
 */
export const MAX_RETRIES = 3;

/**
 * 下载并发数
 * 同时发起的最大下载任务数
 */
export const CONCURRENCY = 3;

/**
 * Tarball 大小阈值（5MB）
 * 超过此值改用 API 策略下载
 */
export const TARBALL_SIZE_THRESHOLD = 5 * 1024 * 1024;

/**
 * 文件数阈值（300）
 * 无法探测 tarball 大小且文件数超过此值时改用 API 策略
 */
export const TREE_COUNT_THRESHOLD = 300;

/**
 * HTTP 下载超时时间（30 秒）
 * Tar 下载策略的超时控制
 */
export const HTTP_TIMEOUT_TAR = 30000;

/**
 * HTTP 下载超时时间（120 秒）
 * ZIP 下载策略的超时控制
 */
export const HTTP_TIMEOUT_ZIP = 120000;
