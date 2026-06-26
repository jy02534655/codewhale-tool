<!--
  index.vue — GitHub Token 管理页面
  每个 Token 有别名(alias) 和 token 值
  页面提供增删改查功能
-->
<template>
  <div class="token-view" v-loading="maskingStore.isLoading">
    <div class="toolbar">
      <h2>{{ $t('token.title') }}</h2>
      <div class="toolbar-actions">
        <el-button type="primary" @click="showAddDialog">{{ $t('token.add') }}</el-button>
        <el-button @click="loadList">{{ $t('common.refresh') }}</el-button>
      </div>
    </div>

    <el-empty v-if="list.length === 0" :description="$t('token.empty')" />

    <div v-else class="token-list">
      <div v-for="t in list" :key="t.id" class="token-item">
        <div class="token-info">
          <span class="token-alias">{{ t.alias }}</span>
          <el-tag v-if="t.default" size="small" type="success" effect="dark">{{ $t('token.default') }}</el-tag>
          <el-tag size="small" type="info" effect="plain">{{ t.token }}</el-tag>
        </div>
        <div class="token-actions">
          <el-button v-if="!t.default" size="small" @click="onSetDefault(t)">{{ $t('token.setDefault') }}</el-button>
          <el-button size="small" @click="showEditDialog(t)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onRemove(t)">{{ $t('common.delete') }}</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible"
      :title="isEdit ? $t('token.edit_title') : $t('token.add_title')"
      width="480px" :close-on-click-modal="false" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item :label="$t('token.alias')" prop="alias">
          <el-input v-model="formData.alias" :placeholder="$t('token.alias_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('token.token_value')" :prop="isEdit ? null : 'token'">
          <el-input v-model="formData.token" type="password" show-password
            :placeholder="isEdit ? $t('token.token_edit_placeholder') : $t('token.token_placeholder')" />
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
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getTokenList, addToken, editToken, removeToken, setDefaultToken } from '@/api/token'
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
  token: '',
})

const rules = {
  alias: [{ required: true, message: () => t('token.alias_required'), trigger: 'blur' }],
  token: [{ required: true, message: () => t('token.token_required'), trigger: 'blur' }],
}

function loadList() {
  getTokenList().then(function (data) {
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
  // 编辑时不回填 token（保持掩码状态），留空表示不修改
  formData.token = ''
  dialogVisible.value = true
}

function resetForm() {
  formData.alias = ''
  formData.token = ''
  if (formRef.value) formRef.value.resetFields()
}

function onSubmit() {
  formRef.value.validate().then(function () {
    submitting.value = true
    var payload = {
      alias: formData.alias,
    }
    // 新增时 token 必填，编辑时仅当输入了新 token 才更新
    if (!isEdit.value || formData.token) {
      payload.token = formData.token
    }
    var promise
    if (isEdit.value) {
      promise = editToken({ id: editingId.value, ...payload })
    } else {
      promise = addToken(payload)
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
    t('token.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeToken(row.id).then(function () { loadList() })
  })
}

function onSetDefault(row) {
  setDefaultToken(row.id).then(function () { loadList() })
}

onMounted(loadList)
</script>

<style scoped>
.token-view { display:flex;flex-direction:column;gap:16px; }
.toolbar { display:flex;justify-content:space-between;align-items:center; }
.toolbar h2 { font-size:20px;margin:0; }
.toolbar-actions { display:flex;gap:8px; }

.token-list { display:flex;flex-direction:column;gap:8px; }
.token-item { display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px; }
.token-info { display:flex;align-items:center;gap:10px; }
.token-alias { font-weight:600;font-size:14px; }
.token-actions { display:flex;gap:6px; }
</style>