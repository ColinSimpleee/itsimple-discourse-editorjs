import Service from "@ember/service";
import { ajax } from "discourse/lib/ajax";

/**
 * MuxApi服务
 * 提供与Mux API的交互方法
 */
export default class MuxApi extends Service {
  /**
   * 创建直接上传
   * @returns {Promise<Object>} 上传数据，包含url和video_id
   */
  createDirectUpload() {
    return ajax("/editorjs/videos/upload", {
      type: "POST"
    });
  }

  /**
   * 获取视频状态
   * @param {string} videoId Mux视频ID
   * @returns {Promise<Object>} 视频状态数据
   */
  getVideoStatus(videoId) {
    return ajax(`/editorjs/videos/${videoId}/status`, {
      type: "GET"
    });
  }
}