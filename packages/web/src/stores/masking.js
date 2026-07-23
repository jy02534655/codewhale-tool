/**
 * masking store — 全局请求遮罩状态管理
 *
 * 按视图维度管理 loading 计数，
 * 确保多个并发请求共享同一个遮罩。
 */

import { defineStore } from 'pinia';
import { find } from 'lodash-es';
import { nameIncreasePrefix } from '@/utils';

export const useMaskingStore = defineStore('masking', {
  getters: {
    /**
     * 是否显示遮罩提示
     *
     * @param {*} state
     * @param {object} state.views 视图集合
     * @param {string} state.activateView 当前激活视图
     * @returns {boolean}
     */
    isLoading: ({ views, activateView }) => {
      const viewList = [activateView];
      // 查找视图集合中是否存在当前激活视图
      const item = find(views, function (item) {
        return viewList.includes(item.view) && item.loadingCount > 0;
      });
      return !!item;
    },
  },
  state: () => ({
    // 视图集合
    views: [],
    // 加载提示文字
    loadingText: '',
    // 当前激活视图
    activateView: '',
  }),
  actions: {
    /**
     * 显示遮罩提示
     *
     * @param {object} opts
     * @param {string} opts.loadingText 提示文字
     * @param {string} opts.view 视图名称
     */
    loading({ loadingText, view } = {}) {
      this.loadingText = loadingText;
      this.countChange({ view });
    },
    /**
     * 隐藏遮罩提示
     *
     * @param {object} opts
     * @param {string} opts.view 视图名称
     * @param {number} [opts.nextTime] 延时关闭毫秒数，默认 100
     */
    clear({ view, nextTime } = {}) {
      setTimeout(() => {
        this.countChange({ view, count: -1 });
      }, nextTime);
    },
    /**
     * 改变指定视图请求总数
     *
     * @param {object} opts
     * @param {number} [opts.count=1] 变化值
     * @param {string} opts.view 视图名称
     */
    countChange({ count = 1, view }) {
      if (!view) return;
      view = nameIncreasePrefix(view);
      const list = this.views;
      let item = find(list, { view });
      if (!item) {
        item = { view, loadingCount: 0 };
        list.push(item);
      }
      item.loadingCount += count;
    },
    /**
     * 设置当前激活视图名称
     *
     * @param {string} view 视图名称
     */
    changeActivate(view) {
      this.activateView = nameIncreasePrefix(view);
    },
    /**
     * 清空所有数据，关闭所有遮罩
     */
    init() {
      this.views = [];
    },
  },
});