import { ajaxPostBack } from '@/utils/request'

// 统一安装接口，调用 ajaxPostBack 只做中转
export function installSkill(data) {
  return ajaxPostBack('/skill/install', data, {
    rootProperty: ''
  })
}

// 直接更新 skill 接口
export function updateSkillByOpts(data) {
  return ajaxPostBack('/skill/update', data, {
    rootProperty: ''
  })
}
