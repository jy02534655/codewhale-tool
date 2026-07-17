<template>
  <el-card class="settings-card instructions-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.instructions_title') }}</span>
        <div>
          <el-button type="primary" size="small" @click="onAddInstruction">
            {{ $t('settings.instructions_add') }}
          </el-button>
          <el-button type="success" size="small" @click="onSave">
            {{ $t('settings.actions_save') }}
          </el-button>
        </div>
      </div>
    </template>

    <div v-if="localInstructions.length === 0" class="instructions-empty">
      {{ $t('settings.instructions_empty') }}
    </div>
    <div v-else class="instruction-list">
      <div v-for="(inst, index) in localInstructions" :key="index" class="instruction-item">
        <div class="instruction-main">
          <div class="instruction-info">
            <span class="instruction-path">{{ inst.path }}</span>
            <el-tag v-if="inst.readonly" type="info" size="small">
              {{ $t('settings.instruction_readonly') }}
            </el-tag>
          </div>
          <div class="instruction-actions">
            <el-button v-if="!inst.readonly" type="primary" link size="small" @click="onEditInstruction(index)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button v-if="!inst.readonly" type="danger" link size="small" @click="onRemoveInstruction(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
            <el-button type="primary" link size="small" :disabled="index === 0" @click="moveInstruction(index, -1)">
              <el-icon><Top /></el-icon>
            </el-button>
            <el-button type="primary" link size="small" :disabled="index === localInstructions.length - 1" @click="moveInstruction(index, 1)">
              <el-icon><Bottom /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-if="inst.content" class="instruction-content">{{ inst.content }}</div>
      </div>
    </div>

    <InstructionDialog ref="instructionDialog" @submitSuccess="onInstructionSubmit" />
  </el-card>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import InstructionDialog from './edit/instruction.vue';
import { updateInstructions as updateInstructionsApi } from '@/api/settings';

const props = defineProps({
  instructions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:instructions', 'save']);

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const editingInstructionIndex = ref(-1);
const localInstructions = ref([...props.instructions]);

watch(() => props.instructions, (newVal) => {
  localInstructions.value = [...newVal];
}, { deep: true });

function emitUpdate() {
  emit('update:instructions', [...localInstructions.value]);
}

function onAddInstruction() {
  editingInstructionIndex.value = -1;
  dialogCtrl.showAddDialog(null, 'instructionDialog');
}

function onEditInstruction(index) {
  editingInstructionIndex.value = index;
  dialogCtrl.showEditDialog(localInstructions.value[index], 'instructionDialog');
}

function onInstructionSubmit({ data, state }) {
  if (state === 0) {
    localInstructions.value.push({ path: data.path, content: data.content });
  } else if (state === 1 && editingInstructionIndex.value >= 0 && editingInstructionIndex.value < localInstructions.value.length) {
    localInstructions.value[editingInstructionIndex.value] = { path: data.path, content: data.content };
  }
  emitUpdate();
}

function onRemoveInstruction(index) {
  localInstructions.value.splice(index, 1);
  emitUpdate();
}

function moveInstruction(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= localInstructions.value.length) return;
  const temp = localInstructions.value[index];
  localInstructions.value[index] = localInstructions.value[target];
  localInstructions.value[target] = temp;
  emitUpdate();
}

function onSave() {
  emit('save');
}
</script>
