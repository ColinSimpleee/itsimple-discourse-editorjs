/**
 * Poll Tool for Editor.js
 */
export default class PollTool {
  static get toolbox() {
    return {
      title: "Poll",
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17 1H3C1.9 1 1 1.9 1 3V17C1 18.1 1.9 19 3 19H17C18.1 19 19 18.1 19 17V3C19 1.9 18.1 1 17 1ZM17 17H3V3H17V17ZM9 10.5H15V12.5H9V10.5ZM9 7.5H15V9.5H9V7.5ZM5 10.5H7V12.5H5V10.5ZM5 7.5H7V9.5H5V7.5ZM5 14.5H15V16.5H5V14.5Z" fill="currentColor"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  static get sanitize() {
    return {
      pollOptions: {},
      pollType: {},
      pollTitle: {},
      pollName: {},
      pollOptionsWithImages: {},
      pollResults: {},
      pollPublic: {}
    };
  }

  constructor({ data, api, config }) {
    this.api = api;
    this.data = {
      pollOptions: data.pollOptions || [],
      pollType: data.pollType || 'regular',
      pollTitle: data.pollTitle || '',
      pollName: data.pollName || 'poll_' + Math.floor(Math.random() * 1000),
      pollOptionsWithImages: data.pollOptionsWithImages || [],
      pollResults: data.pollResults || 'always',
      pollPublic: data.pollPublic !== undefined ? data.pollPublic : true
    };
    this.container = undefined;
    this.settings = config;
    // 尝试获取 Discourse 容器和服务
    this.uploadManager = undefined;
    this.store = undefined;
    try {
      // 在构造函数中尝试获取服务
      const container = window.require('discourse/app').default.__container__;
      if (container) {
        this.uploadManager = container.lookup('service:upload-manager');
        this.store = container.lookup('service:store');
      }
    } catch { // 无参数捕获异常
      // 上传管理器获取失败，将使用备用方案
    }
  }

  render() {
    this.container = document.createElement('div');
    this.container.classList.add('editorjs-poll-tool');

    // Render form
    this._renderForm();

    return this.container;
  }

  _renderForm() {
    // Create poll title field
    const titleField = document.createElement('div');
    titleField.classList.add('poll-tool-field');

    const titleLabel = document.createElement('label');
    titleLabel.classList.add('poll-tool-label');
    titleLabel.textContent = 'Poll Title';
    titleField.appendChild(titleLabel);

    const titleInput = document.createElement('input');
    titleInput.classList.add('poll-tool-input');
    titleInput.value = this.data.pollTitle || '';
    titleInput.placeholder = 'Enter poll title';
    titleInput.addEventListener('input', () => {
      this.data.pollTitle = titleInput.value;
    });
    titleField.appendChild(titleInput);
    this.container.appendChild(titleField);

    // Create poll name field
    const nameField = document.createElement('div');
    nameField.classList.add('poll-tool-field');

    const nameLabel = document.createElement('label');
    nameLabel.classList.add('poll-tool-label');
    nameLabel.textContent = 'Poll Name (Optional)';
    nameField.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.classList.add('poll-tool-input');
    nameInput.value = this.data.pollName || '';
    nameInput.placeholder = 'Enter poll name (used to distinguish multiple polls)';
    nameInput.addEventListener('input', () => {
      this.data.pollName = nameInput.value;
    });
    nameField.appendChild(nameInput);
    this.container.appendChild(nameField);

    // Create poll type field
    const typeField = document.createElement('div');
    typeField.classList.add('poll-tool-field');

    const typeLabel = document.createElement('label');
    typeLabel.classList.add('poll-tool-label');
    typeLabel.textContent = 'Poll Type';
    typeField.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.classList.add('poll-tool-select');

    const regularOption = document.createElement('option');
    regularOption.value = 'regular';
    regularOption.textContent = 'Single';
    regularOption.selected = this.data.pollType === 'regular' || !this.data.pollType;
    typeSelect.appendChild(regularOption);

    const multipleOption = document.createElement('option');
    multipleOption.value = 'multiple';
    multipleOption.textContent = 'Multiple';
    multipleOption.selected = this.data.pollType === 'multiple';
    typeSelect.appendChild(multipleOption);

    typeSelect.addEventListener('change', () => {
      this.data.pollType = typeSelect.value;
      // Initialize default values
      if (!this.data.pollOptionsWithImages || this.data.pollOptionsWithImages.length < 2) {
        this.data.pollOptionsWithImages = [
          { text: '', image: '' },
          { text: '', image: '' }
        ];
        this.data.pollOptions = ['', ''];
      }
      // Re-render form
      this.container.innerHTML = '';
      this._renderForm();
    });

    typeField.appendChild(typeSelect);
    this.container.appendChild(typeField);

    // 创建结果显示时机选项
    const resultsField = document.createElement('div');
    resultsField.classList.add('poll-tool-field');

    const resultsLabel = document.createElement('label');
    resultsLabel.classList.add('poll-tool-label');
    resultsLabel.textContent = 'Result Visibility';
    resultsField.appendChild(resultsLabel);

    const resultsSelect = document.createElement('select');
    resultsSelect.classList.add('poll-tool-select');

    const alwaysOption = document.createElement('option');
    alwaysOption.value = 'always';
    alwaysOption.textContent = 'Always visible';
    alwaysOption.selected = this.data.pollResults === 'always';
    resultsSelect.appendChild(alwaysOption);

    const voteOption = document.createElement('option');
    voteOption.value = 'on_vote';
    voteOption.textContent = 'After voting';
    voteOption.selected = this.data.pollResults === 'on_vote';
    resultsSelect.appendChild(voteOption);

    const closedOption = document.createElement('option');
    closedOption.value = 'on_close';
    closedOption.textContent = 'When poll closes';
    closedOption.selected = this.data.pollResults === 'on_close';
    resultsSelect.appendChild(closedOption);

    const staffOption = document.createElement('option');
    staffOption.value = 'staff_only';
    staffOption.textContent = 'Staff only';
    staffOption.selected = this.data.pollResults === 'staff_only';
    resultsSelect.appendChild(staffOption);

    resultsSelect.addEventListener('change', () => {
      this.data.pollResults = resultsSelect.value;
    });

    resultsField.appendChild(resultsSelect);
    this.container.appendChild(resultsField);

    // 创建公开投票信息选项
    const publicField = document.createElement('div');
    publicField.classList.add('poll-tool-field', 'poll-tool-checkbox-field');

    const publicCheckbox = document.createElement('input');
    publicCheckbox.type = 'checkbox';
    publicCheckbox.id = `poll-public-${Date.now()}`;
    publicCheckbox.classList.add('poll-tool-checkbox');
    publicCheckbox.checked = this.data.pollPublic;
    publicCheckbox.addEventListener('change', () => {
      this.data.pollPublic = publicCheckbox.checked;
    });

    const publicLabel = document.createElement('label');
    publicLabel.classList.add('poll-tool-checkbox-label');
    publicLabel.textContent = 'Show who voted for which option';
    publicLabel.htmlFor = publicCheckbox.id;

    publicField.appendChild(publicCheckbox);
    publicField.appendChild(publicLabel);
    this.container.appendChild(publicField);

    // Create options
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('poll-tool-options');

    const optionsLabel = document.createElement('div');
    optionsLabel.classList.add('poll-tool-label');
    optionsLabel.textContent = 'Poll Options';
    optionsContainer.appendChild(optionsLabel);

    // Ensure at least two options
    if (!this.data.pollOptionsWithImages || this.data.pollOptionsWithImages.length < 2) {
      this.data.pollOptionsWithImages = [
        { text: '', image: '' },
        { text: '', image: '' }
      ];
      this.data.pollOptions = ['', ''];
    }

    const optionsList = document.createElement('div');
    optionsList.classList.add('poll-tool-options-list');

    this.data.pollOptionsWithImages.forEach((option, index) => {
      const optionItem = this._createOptionItemWithImage(option, index);
      optionsList.appendChild(optionItem);
    });

    optionsContainer.appendChild(optionsList);

    // Add new option button
    const addOptionBtn = document.createElement("button");
    addOptionBtn.classList.add("poll-tool-add-option");
    addOptionBtn.textContent = "Add Option";
    addOptionBtn.addEventListener("click", () => {
      this.data.pollOptionsWithImages.push({ text: '', image: '' });
      this.data.pollOptions.push('');
      const newOptionItem = this._createOptionItemWithImage({ text: '', image: '' }, this.data.pollOptionsWithImages.length - 1);
      optionsList.appendChild(newOptionItem);
    });

    optionsContainer.appendChild(addOptionBtn);
    this.container.appendChild(optionsContainer);

    // Add styles
    this._addStyles();
  }

  _createOptionItemWithImage(option, index) {
    const optionItem = document.createElement("div");
    optionItem.classList.add("poll-tool-option-item");

    // Text input
    const optionInputContainer = document.createElement("div");
    optionInputContainer.classList.add("poll-tool-option-input-container");

    const optionInput = document.createElement("input");
    optionInput.classList.add("poll-tool-option-input");
    optionInput.value = option.text || '';
    optionInput.placeholder = `Option ${index + 1} Text`;

    // 定义更新选项数据的函数
    const updateOptionData = () => {
      const newItem = {
        text: optionInput.value,
        image: option.image
      };
      this.data.pollOptionsWithImages[index] = newItem;
      this.data.pollOptions[index] = optionInput.value;
    };

    // 添加多个事件监听器确保数据更新
    optionInput.addEventListener("input", updateOptionData);
    optionInput.addEventListener("change", updateOptionData);
    optionInput.addEventListener("blur", updateOptionData);

    optionInputContainer.appendChild(optionInput);

    // Image upload button
    const imageUploadContainer = document.createElement("div");
    imageUploadContainer.classList.add("poll-tool-image-upload");

    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.classList.add("poll-tool-image-input");
    imageInput.style.display = "none";

    const imageUploadBtn = document.createElement("button");
    imageUploadBtn.classList.add("poll-tool-image-btn");
    imageUploadBtn.type = "button";
    imageUploadBtn.innerHTML = option.image ? "Change Image" : "Add Image";
    imageUploadBtn.addEventListener("click", () => {
      imageInput.click();
    });

    imageUploadContainer.appendChild(imageInput);
    imageUploadContainer.appendChild(imageUploadBtn);

    // Image preview container
    const imagePreview = document.createElement("div");
    imagePreview.classList.add("poll-tool-image-preview");

    if (option.image) {
      const img = document.createElement("img");
      img.src = option.image;
      img.classList.add("poll-tool-preview-img");
      imagePreview.appendChild(img);

      const removeImageBtn = document.createElement("button");
      removeImageBtn.classList.add("poll-tool-remove-image");
      removeImageBtn.innerHTML = "×";
      removeImageBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.data.pollOptionsWithImages[index].image = '';
        imagePreview.innerHTML = '';
        imageUploadBtn.innerHTML = "Add Image";
      });

      imagePreview.appendChild(removeImageBtn);
    }

    // Handle file upload
    imageInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      // Handle file upload using Discourse uploader
      this._uploadImage(file, (imageUrl) => {
        // Update data
        this.data.pollOptionsWithImages[index].image = imageUrl;

        // Update preview
        imagePreview.innerHTML = '';

        const img = document.createElement("img");
        img.src = imageUrl;
        img.classList.add("poll-tool-preview-img");
        imagePreview.appendChild(img);

        const removeImageBtn = document.createElement("button");
        removeImageBtn.classList.add("poll-tool-remove-image");
        removeImageBtn.innerHTML = "×";
        removeImageBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.data.pollOptionsWithImages[index].image = '';
          imagePreview.innerHTML = '';
          imageUploadBtn.innerHTML = "Add Image";
        });

        imagePreview.appendChild(removeImageBtn);
        imageUploadBtn.innerHTML = "Change Image";
      });
    });

    // Remove option button
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("poll-tool-remove-option");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      // Keep at least two options
      if (this.data.pollOptionsWithImages.length <= 2) {
        return;
      }

      this.data.pollOptionsWithImages.splice(index, 1);
      this.data.pollOptions.splice(index, 1);
      // Re-render form
      this.container.innerHTML = '';
      this._renderForm();
    });

    optionItem.appendChild(optionInputContainer);
    optionItem.appendChild(imageUploadContainer);
    optionItem.appendChild(imagePreview);
    optionItem.appendChild(removeBtn);

    return optionItem;
  }

  _uploadImage(file, callback) {
    // 创建加载指示器
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('poll-tool-image-loading');
    loadingElement.textContent = 'Uploading...';
    this.container.appendChild(loadingElement);

    // 优先使用 uploadManager
    if (this.uploadManager && this.store) {
      const upload = this.uploadManager.createUpload(this.store, {
        file,
        type: "composer"
      });

      upload.start().then(response => {
        loadingElement.remove();
        if (response && response.url) {
          let imageUrl = response.url;
          // 处理相对 URL
          if (imageUrl.startsWith('//')) {
            imageUrl = window.location.protocol + imageUrl;
          }
          callback(imageUrl);
        } else {
          this._showUploadError('Upload failed - invalid response');
        }
      }).catch(err => {
        loadingElement.remove();
        this._showUploadError('Upload failed: ' + (err.message || 'Unknown error'));
      });
    } else {
      // 备用方案：使用 AJAX 直接上传
      const formData = new FormData();
      formData.append('files[]', file);
      formData.append('type', 'composer');

      // 获取 CSRF 令牌
      const csrfToken = this._getCSRFToken();

      fetch('/uploads.json', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        loadingElement.remove();
        if (data && data.url) {
          let imageUrl = data.url;
          // 处理相对 URL
          if (imageUrl.startsWith('//')) {
            imageUrl = window.location.protocol + imageUrl;
          }
          callback(imageUrl);
        } else {
          this._showUploadError('Upload failed - invalid response data');
        }
      })
      .catch(error => {
        loadingElement.remove();
        this._showUploadError('Upload error: ' + error.message);
      });
    }
  }

  // 获取 CSRF 令牌
  _getCSRFToken() {
    // 从 meta 标签获取
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // 从 Discourse 全局对象获取
    try {
      const Discourse = window.require('discourse/app').default;
      if (Discourse && Discourse.Session && Discourse.Session.currentProp) {
        return Discourse.Session.currentProp('csrfToken');
      }
    } catch {
      // 忽略错误
    }

    // 从 cookie 获取
    const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith('_csrf_token='));
    if (csrfCookie) {
      return csrfCookie.split('=')[1];
    }

    return '';
  }

  _showUploadError(message) {
    const errorElement = document.createElement('div');
    errorElement.classList.add('poll-tool-error');
    errorElement.textContent = message;
    this.container.appendChild(errorElement);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      errorElement.remove();
    }, 3000);
  }

  _addStyles() {
    if (document.getElementById("poll-tool-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "poll-tool-styles";
    style.textContent = `
      .editorjs-poll-tool {
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        background-color: #f9f9f9;
        margin-bottom: 20px;
        width: 100%;
        box-sizing: border-box;
      }
      .poll-tool-field {
        margin-bottom: 15px;
        width: 100%;
      }
      .poll-tool-label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      .poll-tool-input, .poll-tool-select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .poll-tool-checkbox-field {
        display: flex;
        align-items: center;
      }
      .poll-tool-checkbox {
        margin-right: 8px;
      }
      .poll-tool-checkbox-label {
        font-weight: normal;
        cursor: pointer;
      }
      .poll-tool-options {
        margin-top: 20px;
        width: 100%;
      }
      .poll-tool-options-list {
        margin-bottom: 10px;
        width: 100%;
      }
      .poll-tool-option-item {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 15px;
        width: 100%;
        gap: 8px;
        align-items: flex-start;
      }
      .poll-tool-option-input-container {
        flex-grow: 1;
        min-width: 200px;
      }
      .poll-tool-option-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .poll-tool-image-upload {
        display: flex;
        align-items: center;
      }
      .poll-tool-image-btn {
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
      }
      .poll-tool-image-preview {
        position: relative;
        margin-top: 5px;
        max-width: 150px;
      }
      .poll-tool-preview-img {
        max-width: 100%;
        max-height: 100px;
        border-radius: 4px;
        border: 1px solid #ddd;
      }
      .poll-tool-remove-image {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ff5252;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .poll-tool-remove-option {
        background: #ff5252;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        width: 30px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .poll-tool-add-option {
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        margin-top: 5px;
      }
      .poll-tool-info {
        background-color: #e3f2fd;
        padding: 10px;
        border-radius: 4px;
        color: #0d47a1;
        font-size: 14px;
        margin-top: 10px;
      }
      .poll-tool-image-loading {
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
      }
      .poll-tool-error {
        background-color: #ffebee;
        color: #c62828;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
      }
      .cdx-block.cdx-poll {
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        margin-bottom: 15px;
      }
      .cdx-poll__title {
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 15px;
      }
      .cdx-poll__options {
        margin-top: 10px;
      }
      .cdx-poll__option {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      .cdx-poll__option-input {
        margin-right: 10px;
      }
      .cdx-poll__option-label {
        font-size: 16px;
      }
    `;

    document.head.appendChild(style);
  }

  save() {
    // Validate data
    if (!this.data.pollOptionsWithImages || this.data.pollOptionsWithImages.length < 2) {
      return {
        pollOptions: ['Option 1', 'Option 2'],
        pollType: this.data.pollType || 'regular',
        pollTitle: this.data.pollTitle || '',
        pollName: this.data.pollName,
        pollOptionsWithImages: [
          { text: 'Option 1', image: '' },
          { text: 'Option 2', image: '' }
        ],
        pollResults: this.data.pollResults || 'always',
        pollPublic: this.data.pollPublic !== undefined ? this.data.pollPublic : true
      };
    }

    // Filter empty options
    if (this.data.pollOptionsWithImages) {
      this.data.pollOptionsWithImages = this.data.pollOptionsWithImages.filter(option =>
        option.text.trim() !== '' || option.image !== '');

      // Update simple options array for backward compatibility
      this.data.pollOptions = this.data.pollOptionsWithImages.map(option => option.text);

      // If no options left, add default options
      if (this.data.pollOptionsWithImages.length === 0) {
        this.data.pollOptionsWithImages = [
          { text: 'Option 1', image: '' },
          { text: 'Option 2', image: '' }
        ];
        this.data.pollOptions = ['Option 1', 'Option 2'];
      }
    }

    return {
      pollOptions: this.data.pollOptions,
      pollType: this.data.pollType,
      pollTitle: this.data.pollTitle,
      pollName: this.data.pollName,
      pollOptionsWithImages: this.data.pollOptionsWithImages,
      pollResults: this.data.pollResults,
      pollPublic: this.data.pollPublic !== undefined ? this.data.pollPublic : true
    };
  }
}