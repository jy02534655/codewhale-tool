<!--
  index.vue — 代理管理页面
  每个代理有别名(alias)、类型(type)、地址(host:port)、认证(auth)
  页面提供增删改查功能
-->
<template>
  <div class="proxy-view" v-loading="maskingStore.isLoading">
    <div class="toolbar">
      <h2>{{ $t('proxy.title') }}</h2>
      <div class="toolbar-actions">
        <el-button type="primary" @click="showAddDialog">{{ $t('proxy.add') }}</el-button>
        <el-button @click="loadList">{{ $t('common.refresh') }}</el-button>
      </div>
    </div>

    <el-empty v-if="list.length === 0" :description="$t('proxy.empty')" />

    <div v-else class="proxy-list">
      <div v-for="p in list" :key="p.id" class="proxy-item">
        <div class="proxy-info">
          <span class="proxy-alias">{{ p.alias }}</span>
          <el-tag v-if="p.default" size="small" type="success" effect="dark">{{ $t('proxy.default') }}</el-tag>
          <el-tag size="small" type="info" effect="plain">{{ p.type }}</el-tag>
          <span class="proxy-addr">{{ p.host }}:{{ p.port }}</span>
          <span v-if="p.auth && p.auth.username" class="proxy-auth">{{ p.auth.username }}:{{ p.auth.password }}</span>
        </div>
        <div class="proxy-actions">
          <el-button v-if="!p.default" size="small" @click="onSetDefault(p)">{{ $t('proxy.setDefault') }}</el-button>
          <el-button size="small" @click="showEditDialog(p)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onRemove(p)">{{ $t('common.delete') }}</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible"
      :title="isEdit ? $t('proxy.edit_title') : $t('proxy.add_title')"
      width="480px" :close-on-click-modal="false" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item :label="$t('common.alias')" prop="alias">
          <el-input v-model="formData.alias" :placeholder="$t('proxy.alias_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('proxy.type')" prop="type">
          <el-select v-model="formData.type" :placeholder="$t('proxy.type_placeholder')" style="width:100%">
            <el-option label="HTTP" value="http" />
            <el-option label="SOCKS5" value="socks5" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('proxy.host')" prop="host">
          <el-input v-model="formData.host" :placeholder="$t('proxy.host_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('proxy.port')" prop="port">
          <el-input v-model.number="formData.port" type="number" :placeholder="$t('proxy.port_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('proxy.auth_username')">
          <el-input v-model="formData.username" :placeholder="$t('proxy.auth_username_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('proxy.auth_password')">
          <el-input v-model="formData.password" type="password" show-password :placeholder="$t('proxy.auth_password_placeholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getProxyList, addProxy, editProxy, removeProxy, setDefaultProxy } from '@/api/proxy'
import { useMaskingStore } from '@/stores/masking'

const { t } = useI18n({ useScope: 'global' })
const maskingStore = useMaskingStore()

const list = ref([])
const formRef = ref(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const submitting = ref(false)

const formData = reactive({
  alias: '',
  type: 'socks5',
  host: '',
  port: undefined,
  username: '',
  password: '',
})

const rules = {
  alias: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  type: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  host: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  port: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
}

function loadList() {
  getProxyList().then(function (data) {
    list.value = data || []
  })
}

function showAddDialog() {
  resetForm()
  isEdit.value = false
  editingId.value = ''
  dialogVisible.value = true
}

function showEditDialog(row) {
  resetForm()
  isEdit.value = true
  editingId.value = row.id
  formData.alias = row.alias
  formData.type = row.type || 'socks5'
  formData.host = row.host || ''
  formData.port = row.port || undefined
  formData.username = (row.auth && row.auth.username) || ''
  formData.password = (row.auth && row.auth.password) || ''
  dialogVisible.value = true
}

function resetForm() {
  formData.alias = ''
  formData.type = 'socks5'
  formData.host = ''
  formData.port = undefined
  formData.username = ''
  formData.password = ''
  if (formRef.value) formRef.value.resetFields()
}

function onSubmit() {
  formRef.value.validate().then(function () {
    submitting.value = true
    var payload = {
      alias: formData.alias,
      type: formData.type,
      host: formData.host,
      port: formData.port,
      auth: (formData.username || formData.password)
        ? { username: formData.username || '', password: formData.password || '' }
        : undefined,
    }
    var promise
    if (isEdit.value) {
      promise = editProxy({ id: editingId.value, ...payload })
    } else {
      promise = addProxy(payload)
    }
    promise.then(function () {
      dialogVisible.value = false
      loadList()
    }).finally(function () {
      submitting.value = false
    })
  }).catch(function () { /* validation failed */ })
}

function onRemove(row) {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeProxy(row.id).then(function () { loadList() })
  })
}

function onSetDefault(row) {
  setDefaultProxy(row.id).then(function () { loadList() })
}

onMounted(loadList)
</script>

<style scoped>
.proxy-view { display:flex;flex-direction:column;gap:16px; }
.toolbar { display:flex;justify-content:space-between;align-items:center; }
.toolbar h2 { font-size:20px;margin:0; }
.toolbar-actions { display:flex;gap:8px; }

.proxy-list { display:flex;flex-direction:column;gap:8px; }
.proxy-item { display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px; }
.proxy-info { display:flex;align-items:center;gap:10px; }
.proxy-alias { font-weight:600;font-size:14px; }
.proxy-addr { font-family:monospace;font-size:13px;color:var(--text-secondary); }
.proxy-auth { font-family:monospace;font-size:12px;color:var(--text-secondary); }
.proxy-actions { display:flex;gap:6px; }
</style>