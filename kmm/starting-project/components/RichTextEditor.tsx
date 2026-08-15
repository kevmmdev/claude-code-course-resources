'use client';

import { useEditor, EditorContent, type Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
  initialContent?: JSONContent;
  onChange: (json: JSONContent) => void;
}

export function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: initialContent ?? { type: 'doc', content: [] },
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[240px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className='mt-2' />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const buttonClass = (active: boolean) =>
    `rounded-md px-2 py-1 text-sm ${
      active ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className='flex flex-wrap gap-1 rounded-md border border-gray-200 bg-gray-50 p-2'>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        aria-pressed={editor.isActive('bold')}
      >
        Bold
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        aria-pressed={editor.isActive('italic')}
      >
        Italic
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={buttonClass(editor.isActive('paragraph'))}
        aria-pressed={editor.isActive('paragraph')}
      >
        Paragraph
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        aria-pressed={editor.isActive('heading', { level: 1 })}
      >
        H1
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        aria-pressed={editor.isActive('heading', { level: 2 })}
      >
        H2
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        aria-pressed={editor.isActive('heading', { level: 3 })}
      >
        H3
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        aria-pressed={editor.isActive('bulletList')}
      >
        List
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={buttonClass(editor.isActive('code'))}
        aria-pressed={editor.isActive('code')}
      >
        Code
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={buttonClass(editor.isActive('codeBlock'))}
        aria-pressed={editor.isActive('codeBlock')}
      >
        Code block
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={buttonClass(false)}
      >
        Horizontal rule
      </button>
    </div>
  );
}
