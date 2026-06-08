import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Heading2,
  Heading3,
  Heading4,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
  Info,
  Lightbulb,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';
import { sanitizeBlogHtml } from '../../utils/sanitizeHtml';

type UploadResponse = {
  url: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'document';
};

type RichBlogEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const buttonClass = 'inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900';

function createAttachmentHtml(upload: UploadResponse): string {
  return `<p><a class="blog-attachment-card" href="${upload.url}" target="_blank" rel="noopener noreferrer" title="${upload.originalName}"><strong>${upload.originalName}</strong><span>${Math.round(upload.size / 1024)} KB ${upload.mimeType}</span></a></p>`;
}

export function RichBlogEditor({ value, onChange }: RichBlogEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!editorRef.current || editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value || '<p></p>';
  }, [value]);

  const syncContent = () => {
    if (!editorRef.current) return;
    onChange(sanitizeBlogHtml(editorRef.current.innerHTML));
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncContent();
  };

  const formatBlock = (tag: 'p' | 'h2' | 'h3' | 'h4' | 'blockquote') => {
    runCommand('formatBlock', tag);
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    syncContent();
  };

  const addLink = () => {
    const href = window.prompt('Paste the link URL');
    if (!href) return;
    runCommand('createLink', href);
  };

  const insertCallout = (kind: 'info' | 'tip' | 'warning' | 'quote') => {
    const labels = {
      info: 'Info',
      tip: 'Tip',
      warning: 'Note',
      quote: 'Quote',
    };
    insertHtml(`<div class="blog-callout blog-callout-${kind}"><strong>${labels[kind]}</strong><p>Write the ${labels[kind].toLowerCase()} content here.</p></div><p></p>`);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    setIsUploading(true);

    const body = new FormData();
    body.append('file', file);

    try {
      const response = await fetch(apiUrl('/api/admin/uploads'), {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadError(data.error || 'Upload failed.');
        return;
      }

      const upload = data as UploadResponse;
      if (upload.kind === 'image') {
        insertHtml(`<p><img src="${upload.url}" alt="${upload.originalName}" class="blog-content-image" /></p><p></p>`);
      } else {
        insertHtml(createAttachmentHtml(upload));
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (documentInputRef.current) documentInputRef.current.value = '';
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMode('edit')} className={`${buttonClass} ${mode === 'edit' ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white' : ''}`}>
            Edit
          </button>
          <button type="button" onClick={() => setMode('preview')} className={`${buttonClass} ${mode === 'preview' ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white' : ''}`}>
            Preview
          </button>
        </div>
        <span className="text-xs font-medium text-zinc-400">
          {isUploading ? 'Uploading...' : 'HTML is saved to the existing content field'}
        </span>
      </div>

      {mode === 'edit' && (
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-3">
          <button type="button" className={buttonClass} onClick={() => formatBlock('p')}>P</button>
          <button type="button" className={buttonClass} onClick={() => formatBlock('h2')}><Heading2 className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => formatBlock('h3')}><Heading3 className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => formatBlock('h4')}><Heading4 className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('underline')}><Underline className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('insertUnorderedList')}><List className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => formatBlock('blockquote')}><Quote className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={addLink}><LinkIcon className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('insertHorizontalRule')}><Minus className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('undo')}><Undo2 className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('redo')}><Redo2 className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => runCommand('removeFormat')}><RemoveFormatting className="h-4 w-4" /></button>
          <button type="button" className={buttonClass} onClick={() => imageInputRef.current?.click()}><Image className="h-4 w-4" /> Insert Image</button>
          <button type="button" className={buttonClass} onClick={() => documentInputRef.current?.click()}><Paperclip className="h-4 w-4" /> Attach Document</button>
          <button type="button" className={buttonClass} onClick={() => insertCallout('info')}><Info className="h-4 w-4" /> Info</button>
          <button type="button" className={buttonClass} onClick={() => insertCallout('tip')}><Lightbulb className="h-4 w-4" /> Tip</button>
          <button type="button" className={buttonClass} onClick={() => insertCallout('warning')}><AlertTriangle className="h-4 w-4" /> Note</button>
          <button type="button" className={buttonClass} onClick={() => insertCallout('quote')}><Quote className="h-4 w-4" /> Quote block</button>
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} />
          <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} />
        </div>
      )}

      {uploadError && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {uploadError}
        </div>
      )}

      {mode === 'edit' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          className="blog-rich-editor min-h-[360px] max-h-[680px] overflow-y-auto p-5 text-zinc-800 outline-none"
        />
      ) : (
        <div className="min-h-[360px] bg-white p-6">
          <div className="blog-content-preview" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(value) || '<p class="text-zinc-400">Nothing to preview yet.</p>' }} />
        </div>
      )}
    </div>
  );
}
