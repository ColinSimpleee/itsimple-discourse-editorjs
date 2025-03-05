/**
 * EditorJS Demo Tool
 * 一个简单的演示工具，用于在编辑器中插入 "Hello World" 块
 */

class DemoTool {
  static get toolbox() {
    return {
      title: 'Demo',
      icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><path d="M13.568 4.207a1.852 1.852 0 0 0-2.155.725c-.11.169-.179.345-.202.527l-1.574 1.574a4.7 4.7 0 0 0-1.913-.408c-2.592 0-4.7 2.097-4.7 4.677 0 2.58 2.108 4.676 4.7 4.676 2.592 0 4.7-2.097 4.7-4.676 0-.662-.139-1.292-.39-1.862l1.589-1.589c.168-.02.33-.085.487-.186a1.85 1.85 0 0 0 .726-2.155 1.845 1.845 0 0 0-1.268-1.303zm-5.844 9.684c-1.594 0-2.888-1.287-2.888-2.873 0-1.586 1.294-2.873 2.888-2.873 1.594 0 2.888 1.287 2.888 2.873 0 1.586-1.294 2.873-2.888 2.873z" fill-rule="evenodd"></path></svg>'
    };
  }

  constructor({data, api}) {
    this.data = {
      message: data.message || '添加视频',
      videoUrl: data.videoUrl || null
    };
    this.api = api;
    this.file = null;
    this.uploading = false;
    this.uploadProgress = 0;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('demo-block');
    
    // 如果有视频URL，显示视频
    if (this.data.videoUrl) {
      const videoElement = document.createElement('video');
      videoElement.src = this.data.videoUrl;
      videoElement.controls = true;
      videoElement.style.width = '100%';
      videoElement.style.maxHeight = '400px';
      wrapper.appendChild(videoElement);
    } else {
      // 否则显示消息
      const messageElement = document.createElement('div');
      messageElement.classList.add('demo-block__message');
      messageElement.textContent = this.data.message;
      wrapper.appendChild(messageElement);
    }
    
    // 添加一些基本样式
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = '#f9f9f9';
    wrapper.style.borderRadius = '5px';
    wrapper.style.border = '1px solid #e0e0e0';
    wrapper.style.margin = '10px 0';
    wrapper.style.textAlign = 'center';
    wrapper.style.fontWeight = 'bold';
    wrapper.style.fontSize = '18px';
    wrapper.style.color = '#333';
    
    // 添加点击事件，打开模态框
    wrapper.addEventListener('click', () => {
      this.openModal();
    });
    
    return wrapper;
  }

  openModal() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.classList.add('demo-modal');
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.classList.add('demo-modal__content');
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = '视频上传';
    modalContent.appendChild(title);
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.classList.add('demo-modal__close');
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    modalContent.appendChild(closeButton);
    
    // 创建上传区域
    const uploadArea = document.createElement('div');
    uploadArea.classList.add('demo-modal__upload-area');
    
    if (this.uploading) {
      // 如果正在上传，显示进度条
      uploadArea.innerHTML = `
        <div class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.uploadProgress}%"></div>
          </div>
          <div class="progress-text">${this.uploadProgress}%</div>
        </div>
      `;
    } else if (this.file) {
      // 如果已选择文件，显示文件信息
      uploadArea.innerHTML = `
        <div class="file-info">
          <p>${this.file.name} (${this.humanFilesize(this.file.size)})</p>
          <button class="upload-button">上传</button>
        </div>
      `;
      
      // 添加上传按钮点击事件
      uploadArea.querySelector('.upload-button').addEventListener('click', () => {
        this.uploadFile();
      });
    } else {
      // 否则显示上传提示
      uploadArea.innerHTML = `
        <div class="upload-prompt">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="upload-prompt-text">点击或拖拽上传视频</div>
          <div class="upload-formats">支持的文件格式: MP4, MOV</div>
          <div class="upload-size-limit">最大文件大小: 200MB</div>
        </div>
        <input type="file" id="video-upload-input" class="file-input" accept=".mp4,.mov" style="display:none;">
      `;
      
      // 添加点击事件，触发文件选择
      uploadArea.addEventListener('click', () => {
        uploadArea.querySelector('#video-upload-input').click();
      });
      
      // 添加文件选择事件
      uploadArea.querySelector('#video-upload-input').addEventListener('change', (e) => {
        this.file = e.target.files[0];
        // 重新打开模态框，显示文件信息
        document.body.removeChild(modal);
        this.openModal();
      });
      
      // 添加拖拽事件
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragging');
      });
      
      uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragging');
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragging');
        this.file = e.dataTransfer.files[0];
        // 重新打开模态框，显示文件信息
        document.body.removeChild(modal);
        this.openModal();
      });
    }
    
    modalContent.appendChild(uploadArea);
    
    // 添加模态框内容到模态框
    modal.appendChild(modalContent);
    
    // 添加模态框到页面
    document.body.appendChild(modal);
    
    // 添加点击模态框外部关闭模态框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  uploadFile() {
    if (!this.file) return;
    
    this.uploading = true;
    this.uploadProgress = 0;
    
    // 重新打开模态框，显示进度条
    const existingModal = document.querySelector('.demo-modal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }
    this.openModal();
    
    // 模拟上传进度
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      
      // 更新进度条
      const progressFill = document.querySelector('.progress-fill');
      const progressText = document.querySelector('.progress-text');
      
      if (progressFill && progressText) {
        progressFill.style.width = `${this.uploadProgress}%`;
        progressText.textContent = `${this.uploadProgress}%`;
      }
      
      // 上传完成
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.uploading = false;
        
        // 模拟获取视频URL
        setTimeout(() => {
          this.data.videoUrl = URL.createObjectURL(this.file);
          
          // 关闭模态框
          const modal = document.querySelector('.demo-modal');
          if (modal) {
            document.body.removeChild(modal);
          }
          
          // 更新编辑器内容
          this.api.blocks.update(this.api.blocks.getCurrentBlockIndex(), this.data);
        }, 500);
      }
    }, 300);
  }

  humanFilesize(size) {
    let i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  }

  save(blockContent) {
    return {
      message: this.data.message,
      videoUrl: this.data.videoUrl
    };
  }

  static get isReadOnlySupported() {
    return true;
  }
}

export default DemoTool; 