import type { JSONContent } from "@tiptap/react";

interface NoteContentRendererProps {
  content: JSONContent;
}

export function NoteContentRenderer({ content }: NoteContentRendererProps) {
  return <div className="space-y-4">{renderNode(content)}</div>;
}

function renderNode(node: JSONContent | undefined, index?: number): React.ReactNode {
  if (!node) return null;

  const key = index !== undefined ? `node-${index}` : undefined;

  switch (node.type) {
    case "doc":
      return node.content?.map((child, i) => renderNode(child, i));

    case "paragraph":
      return (
        <p key={key} className="leading-relaxed">
          {node.content?.map((child, i) => renderTextNode(child, i))}
        </p>
      );

    case "heading": {
      const level = (node.attrs?.level || 1) as 1 | 2 | 3;
      const headingClasses = {
        1: "text-3xl font-bold",
        2: "text-2xl font-bold",
        3: "text-xl font-bold",
      }[level];
      const HeadingTag = `h${level}` as const;

      return (
        <HeadingTag key={key} className={`mt-6 mb-3 ${headingClasses}`}>
          {node.content?.map((child, i) => renderTextNode(child, i))}
        </HeadingTag>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc list-inside space-y-1 pl-4">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal list-inside space-y-1 pl-4">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="text-base">
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );

    case "codeBlock":
      return (
        <pre key={key} className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
          <code>{node.content?.map((child, i) => renderTextNode(child, i))}</code>
        </pre>
      );

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-4 border-t border-gray-200" />;

    case "hardBreak":
      return <br key={key} />;

    default:
      return node.content?.map((child, i) => renderNode(child, i)) ?? null;
  }
}

function renderTextNode(node: JSONContent | undefined, index: number): React.ReactNode {
  if (!node) return null;

  if (node.type === "text") {
    let text: React.ReactNode = node.text ?? "";

    if (node.marks && node.marks.length > 0) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
            text = <strong key={`mark-${index}-bold`}>{text}</strong>;
            break;
          case "italic":
            text = <em key={`mark-${index}-italic`}>{text}</em>;
            break;
          case "code":
            text = (
              <code key={`mark-${index}-code`} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm">
                {text}
              </code>
            );
            break;
          case "strike":
            text = <del key={`mark-${index}-strike`}>{text}</del>;
            break;
        }
      }
    }

    return text;
  }

  return renderNode(node, index);
}
