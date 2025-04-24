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
      pollName: {}
    };
  }

  constructor({ data, api, config }) {
    this.api = api;
    this.data = {
      pollOptions: data.pollOptions || [],
      pollType: data.pollType || 'regular',
      pollTitle: data.pollTitle || '',
      pollName: data.pollName || 'poll_' + Math.floor(Math.random() * 1000)
    };
    this.container = undefined;
    this.settings = config;
  }

  render() {
    this.container = document.createElement("div");
    this.container.classList.add("editorjs-poll-tool");

    // 创建表单界面
    this._renderForm();

    return this.container;
  }

  _renderForm() {
    // 创建标题输入
    const titleContainer = document.createElement("div");
    titleContainer.classList.add("poll-tool-field");
    
    const titleLabel = document.createElement("label");
    titleLabel.textContent = "投票标题：";
    titleLabel.classList.add("poll-tool-label");
    
    const titleInput = document.createElement("input");
    titleInput.classList.add("poll-tool-input");
    titleInput.value = this.data.pollTitle;
    titleInput.placeholder = "添加投票标题";
    titleInput.addEventListener("input", () => {
      this.data.pollTitle = titleInput.value;
    });
    
    titleContainer.appendChild(titleLabel);
    titleContainer.appendChild(titleInput);
    this.container.appendChild(titleContainer);

    // 创建类型选择
    const typeContainer = document.createElement("div");
    typeContainer.classList.add("poll-tool-field");
    
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "投票类型：";
    typeLabel.classList.add("poll-tool-label");
    
    const typeSelect = document.createElement("select");
    typeSelect.classList.add("poll-tool-select");
    typeSelect.value = this.data.pollType;
    
    const typeOptions = [
      { value: 'regular', text: '单选' },
      { value: 'multiple', text: '多选' },
      { value: 'number', text: '数字评分' }
    ];
    
    typeOptions.forEach(option => {
      const optionEl = document.createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = option.text;
      if (option.value === this.data.pollType) {
        optionEl.selected = true;
      }
      typeSelect.appendChild(optionEl);
    });
    
    typeSelect.addEventListener("change", () => {
      this.data.pollType = typeSelect.value;
      // 重新渲染表单，以更新选项部分
      this.container.innerHTML = '';
      this._renderForm();
    });
    
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelect);
    this.container.appendChild(typeContainer);

    // 根据投票类型渲染不同的选项输入方式
    if (this.data.pollType === 'number') {
      // 对于数字评分类型，不需要选项
      const numberContainer = document.createElement("div");
      numberContainer.classList.add("poll-tool-info");
      numberContainer.textContent = "数字评分投票不需要添加选项，将自动生成数字选项";
      this.container.appendChild(numberContainer);
    } else {
      // 为单选和多选类型创建选项输入
      const optionsContainer = document.createElement("div");
      optionsContainer.classList.add("poll-tool-options");
      
      const optionsLabel = document.createElement("label");
      optionsLabel.textContent = "投票选项：";
      optionsLabel.classList.add("poll-tool-label");
      optionsContainer.appendChild(optionsLabel);
      
      // 显示现有选项
      const optionsList = document.createElement("div");
      optionsList.classList.add("poll-tool-options-list");
      
      // 确保至少有两个选项
      if (this.data.pollOptions.length < 2) {
        this.data.pollOptions = ['', ''];
      }
      
      this.data.pollOptions.forEach((option, index) => {
        const optionItem = this._createOptionItem(option, index);
        optionsList.appendChild(optionItem);
      });
      
      optionsContainer.appendChild(optionsList);
      
      // 添加新选项按钮
      const addOptionBtn = document.createElement("button");
      addOptionBtn.classList.add("poll-tool-add-option");
      addOptionBtn.textContent = "添加选项";
      addOptionBtn.addEventListener("click", () => {
        this.data.pollOptions.push('');
        const newOptionItem = this._createOptionItem('', this.data.pollOptions.length - 1);
        optionsList.appendChild(newOptionItem);
      });
      
      optionsContainer.appendChild(addOptionBtn);
      this.container.appendChild(optionsContainer);
    }

    // 添加样式
    this._addStyles();
  }

  _createOptionItem(option, index) {
    const optionItem = document.createElement("div");
    optionItem.classList.add("poll-tool-option-item");
    
    const optionInput = document.createElement("input");
    optionInput.classList.add("poll-tool-option-input");
    optionInput.value = option;
    optionInput.placeholder = `选项 ${index + 1}`;
    optionInput.addEventListener("input", () => {
      this.data.pollOptions[index] = optionInput.value;
    });
    
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("poll-tool-remove-option");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      // 至少保留两个选项
      if (this.data.pollOptions.length <= 2) {
        return;
      }
      
      this.data.pollOptions.splice(index, 1);
      // 重新渲染表单
      this.container.innerHTML = '';
      this._renderForm();
    });
    
    optionItem.appendChild(optionInput);
    optionItem.appendChild(removeBtn);
    
    return optionItem;
  }

  _addStyles() {
    if (document.getElementById("poll-tool-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "poll-tool-styles";
    style.textContent = `
      .editorjs-poll-tool {
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        background-color: #f9f9f9;
        margin-bottom: 20px;
      }
      .poll-tool-field {
        margin-bottom: 15px;
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
      .poll-tool-options {
        margin-top: 20px;
      }
      .poll-tool-options-list {
        margin-bottom: 10px;
      }
      .poll-tool-option-item {
        display: flex;
        margin-bottom: 8px;
      }
      .poll-tool-option-input {
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-right: 8px;
      }
      .poll-tool-remove-option {
        background: #ff5252;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        padding: 0 10px;
      }
      .poll-tool-add-option {
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 15px;
        cursor: pointer;
      }
      .poll-tool-info {
        padding: 10px;
        background-color: #e8f4fd;
        border-radius: 4px;
        margin-top: 10px;
        color: #555;
      }
    `;
    document.head.appendChild(style);
  }

  save() {
    // 验证数据
    if (this.data.pollType !== 'number' && (!this.data.pollOptions || this.data.pollOptions.length < 2)) {
      return {
        pollOptions: ['选项1', '选项2'],
        pollType: this.data.pollType || 'regular',
        pollTitle: this.data.pollTitle || '',
        pollName: this.data.pollName
      };
    }

    // 过滤掉空选项
    if (this.data.pollOptions) {
      this.data.pollOptions = this.data.pollOptions.filter(option => option.trim() !== '');
      
      // 如果过滤后没有选项，添加默认选项
      if (this.data.pollOptions.length === 0 && this.data.pollType !== 'number') {
        this.data.pollOptions = ['选项1', '选项2'];
      }
    }

    return {
      pollOptions: this.data.pollOptions,
      pollType: this.data.pollType,
      pollTitle: this.data.pollTitle,
      pollName: this.data.pollName
    };
  }
} 