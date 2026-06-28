import { MathJax } from 'better-react-mathjax';

export default function MathText({ text }) {
  if (!text) return null;
  return (
    <MathJax dynamic>
      {text}
    </MathJax>
  );
}