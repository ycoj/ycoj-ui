import './style/both.css';
import starryNight from '@/shared/lib/code-highlighter';
import { toHtml } from 'hast-util-to-html';

type Props = {
  code: string;
  language: string;
};

/**
 * **注意：这个组件使用 dangerouslySetInnerHTML，确保代码是可信的再使用**
 *
 * @param code 要渲染的代码
 * @param language 代码的语言，会被转换为 starry-night 的 scope
 */
export default function CodeRenderer({ code, language }: Props) {
  const scope =
    starryNight.flagToScope(language) ?? starryNight.flagToScope('cpp');
  const tree = starryNight.highlight(code, scope!);
  const html = toHtml(tree);
  return <pre dangerouslySetInnerHTML={{ __html: html }}></pre>;
}
