/**
 * Video Tool for Editor.js
 */
import { getOwner } from "@ember/application";
import { createUpload } from "../vendor/upchunk";

export default class VideoTool {
  static get toolbox() {
    return {
      title: "Video",
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M18 4.5V15.5C18 16.0523 17.5523 16.5 17 16.5H3C2.44772 16.5 2 16.0523 2 15.5V4.5C2 3.94772 2.44772 3.5 3 3.5H17C17.5523 3.5 18 3.94772 18 4.5ZM13.5 10L8 6.5V13.5L13.5 10Z" fill="currentColor"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  static get sanitize() {
    return {
      videoId: {},
      playbackId: {},
      thumbnailUrl: {},
      duration: {}
    };
  }

  constructor({ data, api, config }) {
    this.api = api;
    this.data = {
      videoId: data.videoId || "",
      playbackId: data.playbackId || "",
      thumbnailUrl: data.thumbnailUrl || "",
      duration: data.duration || 0
    };
    this.container = undefined;
    this.settings = config;
    this.uploading = false;
    this.uploadProgress = 0;
  }

  render() {
    this.container = document.createElement("div");
    this.container.classList.add("editorjs-video-tool");

    if (this.data.videoId && this.data.playbackId) {
      this._renderVideo();
    } else {
      this._renderUploader();
    }

    return this.container;
  }

  _renderVideo() {
    const videoContainer = document.createElement("div");
    videoContainer.classList.add("video-container");

    // 创建视频播放器
    const videoPlayer = document.createElement("div");
    videoPlayer.classList.add("video-player");

    // 使用 Mux 播放器
    videoPlayer.innerHTML = `
      <iframe
        src="https://stream.mux.com/${this.data.playbackId}.m3u8.html"
        width="100%"
        height="100%"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `;

    videoContainer.appendChild(videoPlayer);

    // 添加视频信息
    if (this.data.thumbnailUrl) {
      const videoInfo = document.createElement("div");
      videoInfo.classList.add("video-info");

      const duration = this._formatDuration(this.data.duration);

      videoInfo.innerHTML = `
        <div class="video-duration">${duration}</div>
      `;

      videoContainer.appendChild(videoInfo);
    }

    this.container.appendChild(videoContainer);
  }

  _renderUploader() {
    // 创建上传界面
    const uploaderContainer = document.createElement("div");
    uploaderContainer.classList.add("video-uploader-container");

    if (this.uploading) {
      this._renderUploadProgress(uploaderContainer);
    } else {
      this._renderUploadForm(uploaderContainer);
    }

    this.container.appendChild(uploaderContainer);
  }

  _renderUploadForm(container) {
    container.innerHTML = `
      <div class="video-uploader-form">
        <div class="video-uploader-icon">
          <svg width="50" height="50" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 4.5V15.5C18 16.0523 17.5523 16.5 17 16.5H3C2.44772 16.5 2 16.0523 2 15.5V4.5C2 3.94772 2.44772 3.5 3 3.5H17C17.5523 3.5 18 3.94772 18 4.5ZM13.5 10L8 6.5V13.5L13.5 10Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="video-uploader-text">Click to upload video</div>
        <div class="video-uploader-hint">Support MP4, WebM, Ogg format</div>
        <input type="file" class="video-file-input" accept="video/mp4,video/webm,video/ogg" style="display:none;">
      </div>
    `;

    // 添加样式
    this._addStyles();

    // 添加点击事件
    container.querySelector(".video-uploader-form").addEventListener("click", () => {
      const fileInput = container.querySelector(".video-file-input");
      fileInput.click();
    });

    // 添加文件选择事件
    container.querySelector(".video-file-input").addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      this.uploading = true;
      this._renderUploadProgress(container);
      this._uploadVideo(file);
    });
  }

  _renderUploadProgress(container) {
    container.innerHTML = `
      <div class="video-uploader-uploading">
        <div class="video-uploader-progress">
          <div class="video-uploader-progress-bar" style="width: ${this.uploadProgress}%"></div>
        </div>
        <div class="video-uploader-status">正在上传视频... ${this.uploadProgress.toFixed(1)}%</div>
      </div>
    `;
  }

  _addStyles() {
    if (document.getElementById("video-tool-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "video-tool-styles";
    style.textContent = `
      .video-uploader-form {
        padding: 30px;
        border: 2px dashed #ccc;
        border-radius: 5px;
        text-align: center;
        cursor: pointer;
        background-color: #f9f9f9;
        transition: background-color 0.3s;
      }
      .video-uploader-form:hover {
        background-color: #f0f0f0;
      }
      .video-uploader-icon {
        margin-bottom: 15px;
      }
      .video-uploader-icon svg {
        fill: #666;
      }
      .video-uploader-text {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .video-uploader-hint {
        font-size: 12px;
        color: #888;
      }
      .video-uploader-uploading {
        padding: 20px;
      }
      .video-uploader-progress {
        height: 10px;
        background-color: #eee;
        border-radius: 5px;
        margin-bottom: 10px;
        overflow: hidden;
      }
      .video-uploader-progress-bar {
        height: 100%;
        background-color: #4a90e2;
        transition: width 0.3s;
      }
      .video-uploader-status {
        font-size: 14px;
        color: #666;
      }
      .video-container {
        position: relative;
        width: 100%;
        padding-top: 56.25%; /* 16:9 宽高比 */
      }
      .video-player {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      .video-info {
        margin-top: 5px;
        font-size: 12px;
        color: #888;
      }
    `;
    document.head.appendChild(style);
  }

  async _uploadVideo(file) {
    try {
      // 获取MuxApi服务
      const muxApi = getOwner(this).lookup("service:mux-api");

      // 创建上传
      const uploadData = await muxApi.createDirectUpload();
      
      if (!uploadData || !uploadData.url || !uploadData.video_id) {
        throw new Error("获取上传URL失败");
      }

      this.data.videoId = uploadData.video_id;

      // 使用UpChunk上传文件
      const upload = createUpload({
        file,
        endpoint: uploadData.url,
        chunkSize: 5120 // 5MB分块
      });

      // 监听上传进度
      upload.on("progress", (event) => {
        this.uploadProgress = event.detail;
        const progressContainer = this.container.querySelector(".video-uploader-container");
        if (progressContainer) {
          this._renderUploadProgress(progressContainer);
        }
      });

      // 监听上传完成
      upload.on("success", async () => {
        this.uploadProgress = 100;
        this.uploadStatus = "处理中...";
        
        const progressContainer = this.container.querySelector(".video-uploader-container");
        if (progressContainer) {
          this._renderUploadProgress(progressContainer);
        }

        // 检查视频状态
        this._checkVideoStatus(muxApi, uploadData.video_id);
      });
      
      // 监听上传错误
      upload.on("error", (error) => {
        this.uploading = false;
        
        // 显示错误信息
        const uploaderContainer = this.container.querySelector(".video-uploader-container");
        if (uploaderContainer) {
          uploaderContainer.innerHTML = `
            <div class="video-uploader-error">
              <div class="error-icon">⚠️</div>
              <div class="error-message">上传失败: ${error.detail?.message || '未知错误'}</div>
              <button class="retry-button">重试</button>
            </div>
          `;
          
          // 添加重试按钮事件
          const retryButton = uploaderContainer.querySelector(".retry-button");
          if (retryButton) {
            retryButton.addEventListener("click", () => {
              this._renderUploader();
            });
          }
        }
      });
    } catch (error) {
      this.uploading = false;
      this._renderUploader();
    }
  }

  async _checkVideoStatus(muxApi, videoId) {
    if (!videoId) {
      return;
    }

    try {
      const status = await muxApi.getVideoStatus(videoId);
      
      if (status.state === "ready") {
        this.data = {
          videoId,
          playbackId: status.playback_id,
          thumbnailUrl: status.thumbnail_url,
          duration: status.duration
        };

        // 重新渲染视频
        this.container.innerHTML = "";
        this._renderVideo();
      } else if (status.state === "errored") {
        this.uploading = false;
        
        // 显示错误信息
        const uploaderContainer = this.container.querySelector(".video-uploader-container");
        if (uploaderContainer) {
          uploaderContainer.innerHTML = `
            <div class="video-uploader-error">
              <div class="error-icon">⚠️</div>
              <div class="error-message">视频处理失败</div>
              <button class="retry-button">重试</button>
            </div>
          `;
          
          // 添加重试按钮事件
          const retryButton = uploaderContainer.querySelector(".retry-button");
          if (retryButton) {
            retryButton.addEventListener("click", () => {
              this._renderUploader();
            });
          }
        }
      } else {
        // 如果视频还在处理中，5秒后再次检查
        setTimeout(() => this._checkVideoStatus(muxApi, videoId), 5000);
      }
    } catch (error) {
      setTimeout(() => this._checkVideoStatus(muxApi, videoId), 5000);
    }
  }

  _formatDuration(seconds) {
    if (!seconds) {
      return "00:00";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  save() {
    return {
      videoId: this.data.videoId,
      playbackId: this.data.playbackId,
      thumbnailUrl: this.data.thumbnailUrl,
      duration: this.data.duration
    };
  }
}