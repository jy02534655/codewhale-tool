<!--
  install-log.vue — 安装日志弹窗组件（从 skill/index.vue 提取）
  使用 compositionDialogBase 管理显示/隐藏
--><template>
  <el-dialog v-model="isShow" :title="$t('skill.installLog')" width="720px" top="5vh" :destroy-on-close="true">
    <pre class="log-content-dialog">{{ logContent || $t('skill.noLog') }}</pre>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.close') }}</el-button>
      <el-button v-if="logContent" type="danger" text @click="doClearLog">{{ $t('skill.clearLog') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
// 引入 Vue 响应式 API
import { ref } from 'vue'
// 引入国际化函数
import { useI18n } from 'vue-i18n'
// 引入日志相关 API 方法
import { getInstallLog, clearInstallLog } from '@/api/skill/log'
// 引入 Base 弹窗组合式函数
import { compositionDialogBase } from '@/composition/dialog/Base'

// 启用 Vue I18n（模板中使用 $t）
useI18n({ useScope: 'global' })
// 日志内容
const logContent = ref('')

// 使用 Base 弹窗组合式函数管理显示状态
const { isShow, hideDialog, showDialogByData } = compositionDialogBase({
  // 打开弹窗时自动加载日志
  initfun: () => {
    getInstallLog().then((res) => {
      logContent.value = res || ''
    })
  }
})

// 打开日志弹窗
const open = () => {
  showDialogByData(0, {})
}

// 清除日志
const doClearLog = () => {
  clearInstallLog().then(() => {
    logContent.value = ''
    hideDialog()
  })
}

// 暴露方法供父组件调用
defineExpose({ open: open, hideDialog: hideDialog, doClearLog: doClearLog })
</script>

<style scoped>
.log-content-dialog {
  margin: 0;
  max-height: 60vh;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.65;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
