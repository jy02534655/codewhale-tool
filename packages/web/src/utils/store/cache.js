import { isEmpty, getValueByData } from '@/utils';
import { set, get, isFunction } from 'lodash-es';
export default {
  /**
   * 读取数据
   *
   * @param {*} {
   *
   * requestFun, 获取数据的函数，必须返回Promise函数对象
   *
   * params,  请求数据参数
   *
   * reader 读取数据相关配置
   *
   * }
   * @return {Promise}
   */
  readData({ requestFun, params, reader }) {
    return new Promise((resolve, reject) => {
      if (!requestFun) {
        // 失败回调
        reject({
          isNoFun: true
        });
      } else {
        // 通过代理函数获取数据
        requestFun(params)
          .then((res) => {
            // 读取数据相关配置
            const {
              // 数据根节点名称
              rootProperty,
              // 用于判断请求是否成功的节点名称
              successProperty,
              // 请求成功状态码
              successCode,
              strictSuccessCode
            } = reader;
            // 获取请求数据结果状态
            const code = getValueByData(res, successProperty);
            // eslint-disable-next-line no-useless-assignment
            let success = false;
            if (strictSuccessCode) {
              success = code === successCode;
            } else if (isEmpty(successCode)) {
              success = !isEmpty(code);
            } else {
              success = code === successCode;
              if (!success && !isEmpty(code)) {
                success = code.toString() == successCode.toString();
              }
            }
            if (success) {
              // 获取数据
              const data = getValueByData(res, rootProperty);
              // 成功回调
              resolve(data);
            } else {
              // 失败回调
              reject();
            }
          })
          .catch(() => {
            // 失败回调
            reject();
          });
      }
    });
  },
  /**
   * 用于获取固定数据,同一条数据只会发起一次请求,请求后会缓存在store中
   *
   * @param {Object} store
   * @param {string} dataName store中数据名称
   * @param {Function} requestFun 获取数据的函数，必须返回Promise函数对象
   * @param {Object} params 请求数据参数
   * @param {Object} options 配置参数
   * @param {boolean} options.isReLoad 是否强制重载数据，默认为false
   * @param {string} options.rootProperty 数据根节点名称，默认为'data'
   * @param {string} options.successProperty 状态码字段名称，默认为'success'
   * @param {any} options.successCode 请求成功状态码，默认为true
   * @param {Function} options.transformData 数据转换函数
   * @return {Promise} 返回一个Promise对象，用于异步获取和处理数据
   */
  loadCacheDataByFun(
    store,
    dataName,
    requestFun,
    params,
    {
      isReLoad = false, // 是否强制重载数据，默认为false
      rootProperty, // 数据根节点名称
      successProperty, // 状态码字段名称
      successCode,
      strictSuccessCode = false,
      asyncTransformData = false,
      transformData, // 数据转换函数
      defaultData = []
    } = {}
  ) {
    return new Promise((resolve) => {
      // 从store中获取数据
      const data = get(store, dataName);
      if (isEmpty(data)) {
        set(store, dataName, defaultData);
      }
      // 判断store中是否已有数据,已有数据则不做任何处理
      if (isEmpty(data) || isReLoad) {
        this.readData({
          requestFun,
          params,
          reader: {
            rootProperty,
            successProperty,
            successCode,
            strictSuccessCode
          }
        })
          .then((data) => {
            // 如果有处理数据的函数，那么处理数据
            if (isFunction(transformData)) {
              if (asyncTransformData) {
                transformData(data).then((data) => {
                  set(store, dataName, data);
                  resolve({ data });
                });
                return;
              }
              data = transformData(data);
            }
            set(store, dataName, data);
            resolve({ data });
          })
          .catch(() => {
            // console.error(e);
            set(store, dataName, defaultData);
            // 返回空数据
            resolve({ data: defaultData });
          });
      } else {
        resolve({ data });
      }
    });
  }
};
