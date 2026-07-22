<!--
  SettingsGroupCard.vue — 通用设置：配置分组卡片
  使用动态组件渲染不同类型字段，直接绑定 formData，支持双向数据流。
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t(`${titleKey}.title`) }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item v-for="item in items" :key="item.key" :prop="item.key">
        <template #label>
          <FormItemLabel :label-key="`${props.titleKey}.${item.key}.label`" :help-key="`${props.titleKey}.${item.key}.help`" />
        </template>
        <!-- 动态组件：item.tag 指定组件，v-model 直接绑定 formData 字段 -->
        <component :is="resolveComponent(item.tag)" v-model="formData[item.key]" v-bind="extraProps(item)" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
  import FormItemLabel from '@/components/label/index.vue';
  import SettingsSelect from '@/components/form/select/index.vue';

  // 动态组件名到实际组件的映射，确保本地组件也能通过字符串 tag 正确渲染
  const componentMap = {
    SettingsSelect
  };

  const formData = defineModel('formData');

  const props = defineProps({
    titleKey: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    }
  });

  // 将字符串 tag 解析为实际组件；未知组件保持原字符串，依赖全局注册
  function resolveComponent(tag) {
    return componentMap[tag] || tag;
  }

  // 过滤掉非组件配置项（key / label / tag / value 等元数据），只传递组件真正需要的 props
  function extraProps(item) {
    const { key, label, tag, value, ...rest } = item;
    void key;
    void label;
    void tag;
    void value;

    // 合并 attrs（min、max、step、placeholder 等）
    if (item.attrs) {
      Object.assign(rest, item.attrs);
    }

    // 传递 disabled
    if (item.disabled !== undefined) {
      rest.disabled = item.disabled;
    }

    return rest;
  }


</script>
