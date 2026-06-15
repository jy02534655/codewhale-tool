<!--
  install.vue — Skill 安装弹窗
  使用 compositionDialogBase
--><template>
  <el-dialog v-model="isShow" :title="$t('skill.install')" width="400px" :close-on-click-modal="false" @close="resetForm">
    <el-form label-position="top">
      <el-form-item label="Skill ID">
        <el-input v-model="skillId" placeholder="如 pdf" @keyup.enter="onSubmit" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :disabled="!skillId.trim()" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref } from 'vue'
import { installSkill } from '@/api/skill'
import { useMaskingStore } from '@/stores/masking'
import { compositionDialogBase } from '@/composition/dialog/Base'

const emit = defineEmits(['submitSuccess'])
const maskingStore = useMaskingStore()
const skillId = ref('')

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function () { skillId.value = '' }
})

function resetForm() { skillId.value = '' }

function onSubmit() {
  installSkill(skillId.value.trim())
    .then(function () { hideDialog(); emit('submitSuccess') })
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>