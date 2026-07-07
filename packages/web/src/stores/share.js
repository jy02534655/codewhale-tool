/**
 * share store — 跨组件共享数据缓存
 *
 * 对固定列表数据使用 loadCacheDataByFun 做一次请求 + 本地缓存，
 * 避免列表页、下拉框等重复调用同一接口。
 */

import { defineStore } from 'pinia';
import store from '@/utils/store/cache';
import { getProxyList as getProxyListApi } from '@/api/proxy';
import { getTokenList as getTokenListApi } from '@/api/token';
import { getProjectList as getProjectListApi } from '@/api/project';

function fetchProxyList() {
  return getProxyListApi().then(function (data) {
    return { success: true, data: data };
  });
}

function fetchTokenList() {
  return getTokenListApi().then(function (data) {
    return { success: true, data: data };
  });
}

function fetchProjectList() {
  return getProjectListApi().then(function (data) {
    return { success: true, data: data };
  });
}

export const useShareStore = defineStore('share', {
  state: () => ({
    proxyData: [],
    tokenData: [],
    projectData: []
  }),
  actions: {
    getProxyList(isReLoad = false) {
      return store.loadCacheDataByFun(this, 'proxyData', fetchProxyList, null, {
        isReLoad
      });
    },
    getTokenList(isReLoad = false) {
      return store.loadCacheDataByFun(this, 'tokenData', fetchTokenList, null, {
        isReLoad
      });
    },
    getProjectList(isReLoad = false) {
      return store.loadCacheDataByFun(this, 'projectData', fetchProjectList, null, {
        isReLoad
      });
    }
  }
});
