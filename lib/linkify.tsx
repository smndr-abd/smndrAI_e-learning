import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

// Shows plain text, but turns http(s) links into clickable links.
export function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const m = part.match(/^(.*?)([.,;:!?)\]]*)$/);
        const url = m ? m[1] : part;
        const tail = m ? m[2] : "";
        return (
          <Fragment key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
            {tail}
          </Fragment>
        );
      })}
    </>
  );
}
