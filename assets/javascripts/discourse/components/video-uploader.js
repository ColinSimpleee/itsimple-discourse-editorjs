import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { createUpload } from "../../vendor/upchunk";

export default class VideoUploader extends Component {
  @service muxApi;
  @tracked videoFile = null;
  @tracked isUploading = false;
  @tracked uploadProgress = 0;
  @tracked videoId = null;
  @tracked videoStatus = null;
  @tracked errorMessage = null;

  @action
  selectFile(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // 检查文件类型
    const validTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = "请上传有效的视频文件 (MP4, WebM, Ogg)";
      return;
    }

    this.videoFile = file;
    this.errorMessage = null;
  }

  @action
  async uploadVideo() {
    if (!this.videoFile) {
      this.errorMessage = "请先选择一个视频文件";
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = null;

    try {
      // 获取直接上传URL
      const uploadData = await this.muxApi.createDirectUpload();
      this.videoId = uploadData.video_id;

      // 使用UpChunk上传文件
      const upload = createUpload({
        file: this.videoFile,
        endpoint: uploadData.url,
        chunkSize: 5120, // 5MB 块大小
      });

      // 监听上传进度
      upload.on("progress", (progress) => {
        this.uploadProgress = progress;
      });

      // 监听上传成功
      upload.on("success", () => {
        this.checkVideoStatus();
      });

      // 监听上传错误
      upload.on("error", (err) => {
        this.errorMessage = `上传失败: ${err.detail.message}`;
        this.isUploading = false;
      });
    } catch {
      this.errorMessage = "上传初始化失败";
      this.isUploading = false;
    }
  }

  @action
  async checkVideoStatus() {
    if (!this.videoId) {
      return;
    }

    try {
      const status = await this.muxApi.getVideoStatus(this.videoId);
      this.videoStatus = status;

      if (status.state === "ready") {
        this.isUploading = false;
        if (this.args.onVideoReady) {
          this.args.onVideoReady({
            videoId: this.videoId,
            playbackId: status.playback_id,
            thumbnailUrl: status.thumbnail_url,
            duration: status.duration
          });
        }
      } else if (status.state === "errored") {
        this.errorMessage = "视频处理失败";
        this.isUploading = false;
      } else {
        // 如果视频仍在处理中，继续检查
        setTimeout(() => this.checkVideoStatus(), 5000);
      }
    } catch {
      this.errorMessage = "获取视频状态失败";
      this.isUploading = false;
    }
  }

  @action
  cancelUpload() {
    this.videoFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.videoId = null;
    this.videoStatus = null;
    this.errorMessage = null;
  }
} 