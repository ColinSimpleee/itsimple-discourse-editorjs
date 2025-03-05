/**
 * Video Tool for Editor.js
 */
export default class VideoTool {
  static get toolbox() {
    return {
      title: "视频",
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
  }

  render() {
    this.container = document.createElement("div");
    this.container.classList.add("editorjs-video-tool");

    if (this.data.videoId && this.data.playbackId) {
      this._renderVideo();
    } else {
      this._renderSimpleUploader();
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

  _renderSimpleUploader() {
    // 创建简单的上传界面
    const uploaderContainer = document.createElement("div");
    uploaderContainer.classList.add("video-uploader-container");

    uploaderContainer.innerHTML = `
      <div class="video-uploader-simple">
        <div class="video-uploader-icon">
          <svg width="50" height="50" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 4.5V15.5C18 16.0523 17.5523 16.5 17 16.5H3C2.44772 16.5 2 16.0523 2 15.5V4.5C2 3.94772 2.44772 3.5 3 3.5H17C17.5523 3.5 18 3.94772 18 4.5ZM13.5 10L8 6.5V13.5L13.5 10Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="video-uploader-text">点击上传视频</div>
        <div class="video-uploader-hint">支持MP4、WebM、Ogg格式</div>
        <input type="file" class="video-file-input" accept="video/mp4,video/webm,video/ogg" style="display:none;">
      </div>
    `;

    // 添加样式
    const style = document.createElement("style");
    style.textContent = `
      .video-uploader-simple {
        padding: 30px;
        border: 2px dashed #ccc;
        border-radius: 5px;
        text-align: center;
        cursor: pointer;
        background-color: #f9f9f9;
        transition: background-color 0.3s;
      }
      .video-uploader-simple:hover {
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
    `;
    document.head.appendChild(style);

    // 添加点击事件
    uploaderContainer.querySelector(".video-uploader-simple").addEventListener("click", () => {
      const fileInput = uploaderContainer.querySelector(".video-file-input");
      fileInput.click();
    });

    // 添加文件选择事件
    uploaderContainer.querySelector(".video-file-input").addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      // 显示上传中状态
      uploaderContainer.innerHTML = `
        <div class="video-uploader-uploading">
          <div class="video-uploader-progress">
            <div class="video-uploader-progress-bar" style="width: 0%"></div>
          </div>
          <div class="video-uploader-status">正在上传视频...</div>
        </div>
      `;

      // 这里应该调用实际的上传API
      // 由于我们没有实际的上传API，这里只是模拟上传过程
      this._simulateVideoUpload(file, uploaderContainer);
    });

    this.container.appendChild(uploaderContainer);
  }

  _simulateVideoUpload(file, container) {
    // 模拟上传进度
    let progress = 0;
    const progressBar = container.querySelector(".video-uploader-progress-bar");
    const statusText = container.querySelector(".video-uploader-status");

    const interval = setInterval(() => {
      progress += 5;
      progressBar.style.width = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        statusText.textContent = "视频处理中...";

        // 模拟视频处理完成
        setTimeout(() => {
          // 模拟获取到视频信息
          this.data = {
            videoId: "demo-video-id",
            playbackId: "demo-playback-id",
            thumbnailUrl: "https://image.mux.com/demo-playback-id/thumbnail.jpg",
            duration: 120
          };

          // 重新渲染视频
          this.container.innerHTML = "";
          this._renderVideo();
        }, 2000);
      }
    }, 200);
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