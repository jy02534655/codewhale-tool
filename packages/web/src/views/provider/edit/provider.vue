<!--
  provider.vue — 供应商新增/编辑弹窗
  el-form + formData + rules + assign
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('third_party.edit_dialog_title') : $t('third_party.add_dialog_title')"
    width="520px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="$t('third_party.provider_type')" prop="provider">
        <el-select v-model="formData.provider" :placeholder="$t('common.select_placeholder')"
          style="width:100%" filterable @change="onProviderSelect">
          <el-option v-for="v in vendorOptions" :key="v.id" :label="v.label" :value="v.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('common.alias')" prop="label">
        <el-input v-model="formData.label" :placeholder="vendorLabel(formData.provider)" />
      </el-form-item>
      <el-form-item v-if="!isEdit" :label="$t('third_party.api_key_label')" prop="api_key">
        <el-input v-model="formData.api_key" type="password" show-password
          placeholder="sk-..." />
      </el-form-item>
      <el-form-item :label="$t('third_party.base_url_label')" prop="base_url">
        <el-input v-model="formData.base_url" :placeholder="$t('third_party.base_url_placeholder')" />
      </el-form-item>
      <el-form-item v-if="!isEdit" :label="$t('third_party.initial_models')">
        <el-input v-model="formData.models" :placeholder="$t('third_party.models_placeholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { assign } from 'lodash';
import { addProvider, editProvider } from '@/api/provider/provider';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const maskingStore = useMaskingStore();
const { t, locale } = useI18n({ useScope: 'global' });

// ── 供应商 i18n 映射（内联，不依赖 core 包）─────────────────
const PROVIDER_I18N = {
  siliconflow: { 'zh-Hans': '硅基流动', en: 'SiliconFlow', ja: 'SiliconFlow', 'pt-BR': 'SiliconFlow' },
  'siliconflow-CN': { 'zh-Hans': '硅基流动（中国）', en: 'SiliconFlow China', ja: 'SiliconFlow（中国）', 'pt-BR': 'SiliconFlow China' },
  'wanjie-ark': { 'zh-Hans': '万界方舟', en: 'Wanjie Ark', ja: '万界方舟', 'pt-BR': 'Wanjie Ark' },
  volcengine: { 'zh-Hans': '火山引擎', en: 'Volcengine', ja: 'Volcengine', 'pt-BR': 'Volcengine' },
  'xiaomi-mimo': { 'zh-Hans': '小米 MiMo', en: 'Xiaomi MiMo', ja: 'Xiaomi MiMo', 'pt-BR': 'Xiaomi MiMo' },
  qianfan: { 'zh-Hans': '千帆', en: 'Qianfan', ja: '千帆', 'pt-BR': 'Qianfan' },
  stepfun: { 'zh-Hans': '阶跃星辰', en: 'StepFun', ja: 'StepFun', 'pt-BR': 'StepFun' },
  openai: { 'zh-Hans': 'OpenAI（兼容）', en: 'OpenAI / Compat', ja: 'OpenAI（互換）', 'pt-BR': 'OpenAI / Compat' },
  atlascloud: { 'zh-Hans': 'AtlasCloud', en: 'AtlasCloud', ja: 'AtlasCloud', 'pt-BR': 'AtlasCloud' },
  novita: { 'zh-Hans': 'Novita', en: 'Novita', ja: 'Novita', 'pt-BR': 'Novita' },
  moonshot: { 'zh-Hans': 'Moonshot', en: 'Moonshot', ja: 'Moonshot', 'pt-BR': 'Moonshot' },
  minimax: { 'zh-Hans': 'MiniMax', en: 'MiniMax', ja: 'MiniMax', 'pt-BR': 'MiniMax' },
  zai: { 'zh-Hans': 'Z.ai', en: 'Z.ai', ja: 'Z.ai', 'pt-BR': 'Z.ai' },
  'nvidia-nim': { 'zh-Hans': 'NVIDIA NIM', en: 'NVIDIA NIM', ja: 'NVIDIA NIM', 'pt-BR': 'NVIDIA NIM' },
  openrouter: { 'zh-Hans': 'OpenRouter', en: 'OpenRouter', ja: 'OpenRouter', 'pt-BR': 'OpenRouter' },
  fireworks: { 'zh-Hans': 'Fireworks', en: 'Fireworks', ja: 'Fireworks', 'pt-BR': 'Fireworks' },
  arcee: { 'zh-Hans': 'Arcee', en: 'Arcee', ja: 'Arcee', 'pt-BR': 'Arcee' },
  huggingface: { 'zh-Hans': 'Hugging Face', en: 'Hugging Face', ja: 'Hugging Face', 'pt-BR': 'Hugging Face' },
  together: { 'zh-Hans': 'Together', en: 'Together', ja: 'Together', 'pt-BR': 'Together' },
  'openai-codex': { 'zh-Hans': 'OpenAI Codex', en: 'OpenAI Codex', ja: 'OpenAI Codex', 'pt-BR': 'OpenAI Codex' },
  anthropic: { 'zh-Hans': 'Anthropic', en: 'Anthropic', ja: 'Anthropic', 'pt-BR': 'Anthropic' },
  openmodel: { 'zh-Hans': 'OpenModel', en: 'OpenModel', ja: 'OpenModel', 'pt-BR': 'OpenModel' },
  deepinfra: { 'zh-Hans': 'DeepInfra', en: 'DeepInfra', ja: 'DeepInfra', 'pt-BR': 'DeepInfra' },
  sakana: { 'zh-Hans': 'Sakana', en: 'Sakana', ja: 'Sakana', 'pt-BR': 'Sakana' },
  sglang: { 'zh-Hans': 'SGLang（自托管）', en: 'SGLang (Self)', ja: 'SGLang（自前）', 'pt-BR': 'SGLang (Self)' },
  vllm: { 'zh-Hans': 'vLLM（自托管）', en: 'vLLM (Self)', ja: 'vLLM（自前）', 'pt-BR': 'vLLM (Self)' },
  ollama: { 'zh-Hans': 'Ollama（本地）', en: 'Ollama (Local)', ja: 'Ollama（ローカル）', 'pt-BR': 'Ollama (Local)' },
};

function getVendorLabel(id, loc) {
  const map = PROVIDER_I18N[id];
  return map ? (map[loc] || map['zh-Hans'] || id) : id;
}

function getVendorOptions(loc) {
  return Object.entries(PROVIDER_I18N).map(function ([id, labels]) {
    return { id: id, label: labels[loc] || labels['zh-Hans'] || id };
  });
}

const vendorOptions = computed(function () { return getVendorOptions(locale.value); });
const vendorLabel = function (id) { return getVendorLabel(id, locale.value); };

const formData = reactive({
  provider: undefined,
  label: undefined,
  api_key: undefined,
  base_url: undefined,
  models: undefined,
  id: undefined,
});

/** 校验 base_url：可选，但填了必须是合法 http/https URL */
function validateBaseUrl(rule, value, callback) {
  if (!value) return callback();
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return callback(new Error(t('message.invalidUrl')));
    }
  } catch {
    return callback(new Error(t('message.invalidUrl')));
  }
  callback();
}

const rules = {
  provider: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  api_key: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  base_url: [{ validator: validateBaseUrl, trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
  formName: 'form',
  addFun: addProvider,
  editFun: editProvider,
  initfun({ data }) {
    if (data) assign(formData, data);
  },
});

function onProviderSelect(val) {
  if (val) formData.label = vendorLabel(val);
}

function onSubmit() {
  submitDialogForm(formData);
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>