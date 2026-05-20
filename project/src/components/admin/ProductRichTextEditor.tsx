import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'indent',
  'blockquote',
  'link',
];

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function ProductRichTextEditor({ value, onChange }: Props) {
  return (
    <div className="product-rich-text-editor rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Write a structured description (headings, lists, bold, links…)"
        className="[&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:text-[15px] [&_.ql-editor]:leading-relaxed"
      />
    </div>
  );
}
