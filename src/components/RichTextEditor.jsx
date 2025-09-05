import React, { useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link, Image, 
  Video, Code, Quote, Heading1, Heading2, Heading3, 
  AlignLeft, AlignCenter, AlignRight, Type, Palette,
  Upload, X, Eye, EyeOff
} from 'lucide-react';

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Start writing your content...',
  className = '',
  maxLength = 10000,
  showWordCount = true,
  allowCodeBlocks = true,
  allowImages = true,
  allowVideos = true
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [fontSize, setFontSize] = useState('16');
  const [textColor, setTextColor] = useState('#000000');
  
  const editorRef = useRef(null);

  // Get current selection
  const getSelection = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      return { start, end, text: value.substring(start, end) };
    }
    return { start: 0, end: 0, text: '' };
  };

  // Insert text at cursor position
  const insertText = useCallback((before, after = '', replaceSelection = true) => {
    const selection = getSelection();
    const { start, end, text } = selection;
    
    let newValue;
    if (replaceSelection || text) {
      newValue = value.substring(0, start) + before + text + after + value.substring(end);
    } else {
      newValue = value.substring(0, start) + before + after + value.substring(start);
    }
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (editorRef.current) {
        const newPos = start + before.length + (replaceSelection ? text.length : 0);
        editorRef.current.focus();
        editorRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  }, [value, onChange]);

  // Format handlers
  const handleBold = () => insertText('**', '**');
  const handleItalic = () => insertText('*', '*');
  const handleUnderline = () => insertText('<u>', '</u>');
  const handleHeading1 = () => insertText('\n# ', '\n', false);
  const handleHeading2 = () => insertText('\n## ', '\n', false);
  const handleHeading3 = () => insertText('\n### ', '\n', false);
  const handleBulletList = () => insertText('\n- ', '\n', false);
  const handleNumberedList = () => insertText('\n1. ', '\n', false);
  const handleQuote = () => insertText('\n> ', '\n', false);
  const handleCode = () => insertText('`', '`');
  const handleCodeBlock = () => insertText('\n```\n', '\n```\n', false);

  // Insert image
  const handleInsertImage = () => {
    if (imageUrl.trim()) {
      const altText = imageAlt.trim() || 'Image';
      insertText(`![${altText}](${imageUrl})`, '', false);
      setImageUrl('');
      setImageAlt('');
      setShowImageDialog(false);
    }
  };

  // Insert video
  const handleInsertVideo = () => {
    if (videoUrl.trim()) {
      // Support for YouTube, Vimeo, and direct video URLs
      let embedCode = '';
      
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
          embedCode = `\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>\n`;
        }
      } else if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
        if (videoId) {
          embedCode = `\n<iframe width="560" height="315" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe>\n`;
        }
      } else {
        // Direct video URL
        embedCode = `\n<video width="560" height="315" controls>\n  <source src="${videoUrl}" type="video/mp4">\n  Your browser does not support the video tag.\n</video>\n`;
      }
      
      insertText(embedCode, '', false);
      setVideoUrl('');
      setShowVideoDialog(false);
    }
  };

  // Insert link
  const handleInsertLink = () => {
    if (linkUrl.trim()) {
      const text = linkText.trim() || linkUrl;
      insertText(`[${text}](${linkUrl})`, '', false);
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  // Apply inline styles
  const handleFontSize = () => {
    const selection = getSelection();
    if (selection.text) {
      insertText(`<span style="font-size: ${fontSize}px;">`, '</span>');
    }
  };

  const handleTextColor = () => {
    const selection = getSelection();
    if (selection.text) {
      insertText(`<span style="color: ${textColor};">`, '</span>');
    }
  };

  // Handle file upload for images
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // In a real app, you'd upload to a service like Cloudinary or AWS S3
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  // Preview content (basic markdown to HTML conversion)
  const renderPreview = (content) => {
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^1\. (.*$)/gim, '<li>$1</li>')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/\n/gim, '<br>');
  };

  const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={handleBold}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleItalic}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleUnderline}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={handleHeading1}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleHeading2}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleHeading3}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Lists and Quote */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={handleBulletList}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNumberedList}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleQuote}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Media and Links */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => setShowLinkDialog(true)}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>
          
          {allowImages && (
            <button
              type="button"
              onClick={() => setShowImageDialog(true)}
              className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
              title="Insert Image"
            >
              <Image className="w-4 h-4" />
            </button>
          )}

          {allowVideos && (
            <button
              type="button"
              onClick={() => setShowVideoDialog(true)}
              className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
              title="Insert Video"
            >
              <Video className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Code */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={handleCode}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          
          {allowCodeBlocks && (
            <button
              type="button"
              onClick={handleCodeBlock}
              className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Font Size and Color */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-2 mr-2">
          <div className="flex items-center gap-1">
            <Type className="w-4 h-4 text-gray-700" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
              <option value="24">24px</option>
              <option value="32">32px</option>
            </select>
            <button
              type="button"
              onClick={handleFontSize}
              className="p-1 hover:bg-gray-200 rounded"
              title="Apply Font Size"
            >
              ✓
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-gray-700" />
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={handleTextColor}
              className="p-1 hover:bg-gray-200 rounded"
              title="Apply Text Color"
            >
              ✓
            </button>
          </div>
        </div>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 transition-colors ml-auto"
          title={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
        >
          {isPreviewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreviewMode ? (
          <div 
            className="p-4 min-h-64 prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={editorRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full min-h-64 p-4 border-0 outline-0 resize-none focus:ring-0"
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        )}
      </div>

      {/* Word Count */}
      {showWordCount && (
        <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-sm text-gray-600 flex justify-between">
          <span>{wordCount} words, {charCount} characters</span>
          {maxLength && (
            <span className={charCount > maxLength * 0.9 ? 'text-red-600' : ''}>
              {charCount} / {maxLength}
            </span>
          )}
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <button
                onClick={() => setShowLinkDialog(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowLinkDialog(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Image</h3>
              <button
                onClick={() => setShowImageDialog(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-center text-gray-500">OR</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Image description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowImageDialog(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Insert Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Dialog */}
      {showVideoDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Video</h3>
              <button
                onClick={() => setShowVideoDialog(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube, Vimeo, or direct video URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports YouTube, Vimeo, and direct video links
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowVideoDialog(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertVideo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Insert Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;