import Service from "@ember/service";
import { ajax } from "discourse/lib/ajax";

/**
 * MuxApi 服务
 * 提供与 discourse-video 插件 API 交互的方法
 */
export default class MuxApi extends Service {
  /**
   * 创建直接上传
   * @returns {Promise<Object>} 上传数据，包含 url 和 video_id
   */
  createDirectUpload() {
    return ajax("/discourse-video/direct_uploads", {
      type: "POST"
    });
  }

  /**
   * 获取视频状态
   * @param {string} videoId Mux 视频 ID
   * @returns {Promise<Object>} 视频状态数据
   */
  getVideoStatus(videoId) {
    return ajax(`/discourse-video/videos/${videoId}/status`, {
      type: "GET"
    });
  }
}