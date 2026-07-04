import { ajaxPostBack } from '@/utils/request'

// 统一安装接口，调用 ajaxPostBack 只做中转
export function installSkill(data) {
  return ajaxPostBack('/skill/install', data, {
    rootProperty: '',
    loading: false,
    message: false,
  })
}
