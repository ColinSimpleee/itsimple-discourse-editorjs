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

  constructor({data}) {
    this.data = {
      message: data.message || 'Hello World'
    };
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('demo-block');
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('demo-block__message');
    messageElement.textContent = this.data.message;
    
    wrapper.appendChild(messageElement);
    
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
    
    return wrapper;
  }

  save(blockContent) {
    return {
      message: this.data.message
    };
  }

  static get isReadOnlySupported() {
    return true;
  }
}

export default DemoTool; 