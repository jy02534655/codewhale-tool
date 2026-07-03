// Skill 安装日志 API 接口
import { ajaxBack, ajaxDeleteBack } from '@/utils/request';

// 获取安装日志
export function getInstallLog() { return ajaxBack('/skill/install-log'); }

// 清除安装日志
export function clearInstallLog() { return ajaxDeleteBack('/skill/install-log'); }
