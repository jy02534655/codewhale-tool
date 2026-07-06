<!--
  index.vue — Provider 管理页面容器
  仅负责布局，业务逻辑已拆分到 officialKey.vue 和 thirdParty.vue
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <official-key />
    <third-party />
  </div>
</template>

<script setup>
// 引入全局遮罩状态管理
import { useMaskingStore } from '@/stores/masking';
// 引入官方 API Key 管理子组件
import OfficialKey from './officialKey.vue';
// 引入第三方供应商管理子组件
import ThirdParty from './thirdParty.vue';

// 获取全局遮罩状态
const maskingStore = useMaskingStore();
</script>
