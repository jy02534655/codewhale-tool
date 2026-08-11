<template>
    <el-input
      :model-value="modelValue"
      :placeholder="placeholder || (mode === 'dir' ? '请选择目录' : '请选择文件')"
      readonly
      class="file-picker-input"
      @click="openDialog"
    >
      <template #append>
        <el-button :icon="Folder" @click="openDialog">浏览</el-button>
      </template>
    </el-input>

    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'dir' ? '选择目录' : '选择文件'"
      width="700px"
      destroy-on-close
      append-to-body
    >
      <div class="file-picker-body">
        <!-- 路径输入框与盘符选择 -->
        <div v-if="drives.length > 0" class="file-picker-path-bar">
          <el-select
            v-model="currentDrive"
            placeholder="盘符"
            class="file-picker-drive-select"
            @change="handleDriveChange"
          >
            <el-option
              v-for="drive in drives"
              :key="drive"
              :label="drive"
              :value="drive"
            />
          </el-select>
          <el-input
            v-model="pathInput"
            :placeholder="'请输入绝对路径，如 ' + (currentDrive || defaultRoot) + 'folder'"
            @keyup.enter="handlePathJump"
          >
            <template #append>
              <el-button @click="handlePathJump">跳转</el-button>
            </template>
          </el-input>
        </div>

        <!-- 面包屑导航 -->
        <div class="file-picker-nav">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(crumb, index) in breadcrumbs"
              :key="index"
              @click="navigateTo(index)"
            >
              {{ crumb }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 文件列表 -->
        <el-table
          v-loading="loading"
          :data="items"
          style="width: 100%; flex: 1;"
          :row-class-name="getRowClassName"
          highlight-current-row
          :empty-text="emptyText"
          @row-click="handleRowClick"
          @row-dblclick="handleRowDblClick"
        >
          <el-table-column prop="name" label="名称" min-width="280">
            <template #default="{ row }">
              <span class="item-name">
                <el-icon v-if="row.isDirectory" color="#409eff">
                  <Folder />
                </el-icon>
                <el-icon v-else color="#909399">
                  <Document />
                </el-icon>
                {{ row.name }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路径" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">
            {{ mode === 'dir' ? '选择当前目录' : '选择文件' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder, Document } from '@element-plus/icons-vue'
import { getFileList, getDrives } from '@/api/file'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'file' // 'file' | 'dir'
  },
  accept: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const dialogVisible = ref(false)
const currentPath = ref('')
const items = ref([])
const selectedPath = ref('')
const breadcrumbs = ref([])
const loading = ref(false)
const pathInput = ref('')
const drives = ref([])
const currentDrive = ref('')
const lastPath = ref('') // 持久化上次浏览路径，用于下次打开时恢复

const defaultRoot = 'C:\\'

const canConfirm = computed(() => {
  if (props.mode === 'dir') return !!currentPath.value
  return !!selectedPath.value
})

const emptyText = computed(() => {
  return loading.value ? '加载中...' : '此目录为空'
})

const updateDriveFromPath = (dirPath) => {
  const match = dirPath.match(/^([A-Za-z]:\\|\\\\)/)
  currentDrive.value = match ? match[1].toUpperCase() : ''
};

const openDialog = () => {
  dialogVisible.value = true
  let startPath = props.modelValue
  if (props.mode === 'file' && startPath) {
    const lastSep = Math.max(startPath.lastIndexOf('\\'), startPath.lastIndexOf('/'))
    if (lastSep > 0) {
      startPath = startPath.substring(0, lastSep + 1)
    }
  }
  if (!startPath && lastPath.value) {
    startPath = lastPath.value
  }
  currentPath.value = startPath || defaultRoot
  pathInput.value = currentPath.value
  updateDriveFromPath(currentPath.value)
  loadDir(currentPath.value)
};

const getRowClassName = ({ row }) => {
  return row.isDirectory ? 'folder-row' : 'file-row'
};

const loadDir = async (dirPath) => {
  loading.value = true
  selectedPath.value = ''
  try {
    items.value = await getFileList(dirPath, props.accept, props.mode === 'dir')
    currentPath.value = dirPath
    pathInput.value = dirPath
    updateDriveFromPath(dirPath)
    updateBreadcrumbs(dirPath)
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
};

const loadDrives = async () => {
  try {
    const res = await getDrives()
    if (Array.isArray(res)) {
      drives.value = res
    } else {
      drives.value = []
    }
  } catch {
    drives.value = []
  }
};

const handleDriveChange = (drive) => {
  if (drive) {
    loadDir(drive)
  }
};

const handlePathJump = () => {
  const target = pathInput.value.trim()
  if (!target) return
  loadDir(target)
};

const updateBreadcrumbs = (dirPath) => {
  const parts = dirPath.split(/[\\/]/).filter(Boolean)
  const crumbs = []
  for (const part of parts) {
    crumbs.push(part)
  }
  breadcrumbs.value = crumbs
};

const navigateTo = (index) => {
  const parts = currentPath.value.split(/[\\/]/).filter(Boolean)
  let target = ''
  for (let i = 0; i <= index; i++) {
    target += parts[i] + '\\'
  }
  loadDir(target)
};

const handleRowClick = (row) => {
  if (row.isDirectory) {
    loadDir(row.path)
  } else if (props.mode === 'file') {
    selectedPath.value = row.path
  }
};

const handleRowDblClick = (row) => {
  if (!row.isDirectory && props.mode === 'file') {
    selectedPath.value = row.path
    emit('update:modelValue', selectedPath.value)
    emit('select', selectedPath.value)
    dialogVisible.value = false
  }
};

const matchAccept = (fileName) => {
  if (!props.accept) return true
  const exts = props.accept.split(',').map(s => s.trim().toLowerCase())
  const ext = '.' + fileName.split('.').pop().toLowerCase()
  return exts.includes(ext)
};

const handleConfirm = () => {
  if (props.mode === 'dir') {
    selectedPath.value = currentPath.value
  }
  if (!selectedPath.value) {
    ElMessage.warning('请选择' + (props.mode === 'dir' ? '目录' : '文件'))
    return
  }
  if (props.mode === 'file') {
    const fileName = selectedPath.value.split(/[\\/]/).pop() || ''
    if (!matchAccept(fileName)) {
      ElMessage.warning('文件类型不匹配')
      return
    }
  }
  emit('update:modelValue', selectedPath.value)
  emit('select', selectedPath.value)
  lastPath.value = currentPath.value
  dialogVisible.value = false
};

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal !== currentPath.value) {
    currentPath.value = newVal
  }
})

watch(dialogVisible, (val) => {
  if (val && drives.value.length === 0) {
    loadDrives()
  }
})
</script>

<style scoped>
.file-picker-input {
  width: 100%;
  cursor: pointer;
}
.file-picker-input :deep(.el-input__wrapper) {
  width: 100%;
  cursor: pointer;
}
.file-picker-body {
  height: 400px;
  display: flex;
  flex-direction: column;
}
.file-picker-path-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.file-picker-drive-select {
  width: 120px;
  flex-shrink: 0;
}
.file-picker-nav {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
}
.file-picker-nav :deep(.el-breadcrumb__item) {
  cursor: pointer;
}
.item-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.folder-row {
  cursor: pointer;
}
.file-row {
  cursor: pointer;
}
.file-row.selected {
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}
</style>
