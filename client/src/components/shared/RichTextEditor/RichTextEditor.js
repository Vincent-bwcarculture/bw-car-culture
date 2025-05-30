// src/components/shared/RichTextEditor/RichTextEditor.js
import React, { useState, useRef, useEffect } from 'react';
import './RichTextEditor.css';

const TOOLBAR_ITEMS = [
  { command: 'bold', icon: '𝐁', title: 'Bold' },
  { command: 'italic', icon: '𝑰', title: 'Italic' },
  { command: 'underline', icon: '𝐔', title: 'Underline' },
  { command: 'strikeThrough', icon: '𝐒', title: 'Strike Through' },
  { type: 'separator' },
  { command: 'h1', icon: 'H1', title: 'Heading 1' },
  { command: 'h2', icon: 'H2', title: 'Heading 2' },
  { command: 'h3', icon: 'H3', title: 'Heading 3' },
  { type: 'separator' },
  { command: 'justifyLeft', icon: '←', title: 'Align Left' },
  { command: 'justifyCenter', icon: '↔', title: 'Center' },
  { command: 'justifyRight', icon: '→', title: 'Align Right' },
  { type: 'separator' },
  { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
  { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
  { type: 'separator' },
  { command: 'createLink', icon: '🔗', title: 'Insert Link' },
  { command: 'removeFormat', icon: '⨯', title: 'Clear Formatting' }
];

const RichTextEditor = ({ value, onChange, placeholder, disabled }) => {
  const [htmlContent, setHtmlContent] = useState(value || '');
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value);
    }
  }, [value]);

  const execCommand = (command) => {
    if (disabled) return;
    
    document.execCommand(command, false, null);
    const newContent = editorRef.current.innerHTML;
    setHtmlContent(newContent);
    onChange(newContent);
  };

  const handleLink = () => {
    if (disabled) return;

    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      const newContent = editorRef.current.innerHTML;
      setHtmlContent(newContent);
      onChange(newContent);
    }
  };

  const handleContentChange = () => {
    const newContent = editorRef.current.innerHTML;
    setHtmlContent(newContent);
    onChange(newContent);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&emsp;');
    }
  };

  return (
    <div className={`rich-text-editor ${disabled ? 'disabled' : ''}`}>
      <div className="editor-toolbar" ref={toolbarRef}>
        {TOOLBAR_ITEMS.map((item, index) => {
          if (item.type === 'separator') {
            return <span key={index} className="toolbar-separator" />;
          }

          return (
            <button
              key={index}
              type="button"
              className="toolbar-button"
              title={item.title}
              onClick={() => item.command === 'createLink' ? handleLink() : execCommand(item.command)}
              disabled={disabled}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!disabled}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onInput={handleContentChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
      />
    </div>
  );
};

export default RichTextEditor;