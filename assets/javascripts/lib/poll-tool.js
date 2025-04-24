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
    this.container = document.createElement('div');
    this.container.classList.add('editorjs-poll-tool');

    // 渲染表单
    this._renderForm();

    return this.container;
  }

  _renderForm() {
    // 创建投票标题字段
    const titleField = document.createElement('div');
    titleField.classList.add('poll-tool-field');

    const titleLabel = document.createElement('label');
    titleLabel.classList.add('poll-tool-label');
    titleLabel.textContent = '投票标题';
    titleField.appendChild(titleLabel);

    const titleInput = document.createElement('input');
    titleInput.classList.add('poll-tool-input');
    titleInput.value = this.data.pollTitle || '';
    titleInput.placeholder = '输入投票标题';
    titleInput.addEventListener('input', () => {
      this.data.pollTitle = titleInput.value;
    });
    titleField.appendChild(titleInput);
    this.container.appendChild(titleField);

    // 创建投票名称字段
    const nameField = document.createElement('div');
    nameField.classList.add('poll-tool-field');

    const nameLabel = document.createElement('label');
    nameLabel.classList.add('poll-tool-label');
    nameLabel.textContent = '投票名称（可选）';
    nameField.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.classList.add('poll-tool-input');
    nameInput.value = this.data.pollName || '';
    nameInput.placeholder = '输入投票名称（用于区分多个投票）';
    nameInput.addEventListener('input', () => {
      this.data.pollName = nameInput.value;
    });
    nameField.appendChild(nameInput);
    this.container.appendChild(nameField);

    // 创建投票类型字段
    const typeField = document.createElement('div');
    typeField.classList.add('poll-tool-field');

    const typeLabel = document.createElement('label');
    typeLabel.classList.add('poll-tool-label');
    typeLabel.textContent = '投票类型';
    typeField.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.classList.add('poll-tool-select');

    const regularOption = document.createElement('option');
    regularOption.value = 'regular';
    regularOption.textContent = '单选';
    regularOption.selected = this.data.pollType === 'regular' || !this.data.pollType;
    typeSelect.appendChild(regularOption);

    const multipleOption = document.createElement('option');
    multipleOption.value = 'multiple';
    multipleOption.textContent = '多选';
    multipleOption.selected = this.data.pollType === 'multiple';
    typeSelect.appendChild(multipleOption);

    const numberOption = document.createElement('option');
    numberOption.value = 'number';
    numberOption.textContent = '数字评分';
    numberOption.selected = this.data.pollType === 'number';
    typeSelect.appendChild(numberOption);

    typeSelect.addEventListener('change', () => {
      this.data.pollType = typeSelect.value;

      // 为数字评分初始化默认值
      if (this.data.pollType === 'number' && (!this.data.pollOptions || this.data.pollOptions.length === 0)) {
        this.data.pollOptions = [];
      } else if (this.data.pollType !== 'number' && (!this.data.pollOptions || this.data.pollOptions.length < 2)) {
        this.data.pollOptions = ['', ''];
      }

      // 重新渲染表单
      this.container.innerHTML = '';
      this._renderForm();
    });

    typeField.appendChild(typeSelect);
    this.container.appendChild(typeField);

    // 对于数字评分显示提示
    if (this.data.pollType === 'number') {
      const infoBox = document.createElement('div');
      infoBox.classList.add('poll-tool-info');
      infoBox.textContent = '数字评分投票允许用户选择1到10之间的评分。';
      this.container.appendChild(infoBox);
    } else {
      // 创建选项
      const optionsContainer = document.createElement('div');
      optionsContainer.classList.add('poll-tool-options');

      const optionsLabel = document.createElement('div');
      optionsLabel.classList.add('poll-tool-label');
      optionsLabel.textContent = '投票选项';
      optionsContainer.appendChild(optionsLabel);

      // 确保至少有两个选项
      if (!this.data.pollOptions || this.data.pollOptions.length < 2) {
        this.data.pollOptions = ['', ''];
      }

      const optionsList = document.createElement('div');
      optionsList.classList.add('poll-tool-options-list');

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
        margin-bottom: 8px;
        width: 100%;
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