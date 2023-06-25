import { Root } from 'mdast';
import { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import Slugger from 'github-slugger';
import { parse } from 'acorn';
import { Program } from 'mdast-util-mdxjs-esm/lib';

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface ChildNode {
  type: 'link' | 'text' | 'inlineCode';
  value?: string;
  children?: ChildNode[];
}

export const remarkPluginToc: Plugin<[], Root> = () => {
  return (tree) => {
    const toc: TocItem[] = [];
    const slugger = new Slugger();
    let title = '';
    visit(tree, 'heading', (node) => {
      if (!node.depth || !node.children?.length) {
        return;
      }
      // h1 标题
      if (node.depth === 1) {
        title = (node.children[0] as ChildNode).value;
      }

      // h2 ~ h4 的标题节点
      if (node.depth > 1 && node.depth < 5) {
        const originalText = (node.children as ChildNode[])
          .map((child) => {
            switch (child.type) {
              case 'link':
                return child.children?.map((c) => c.value).join('');
              default:
                return child.value;
            }
          })
          .join('');
        const id = slugger.slug(originalText);
        toc.push({
          id,
          text: originalText,
          depth: node.depth
        });
      }
    });

    // export const toc = [];
    const insertedCode = `export const  toc = ${JSON.stringify(toc, null, 2)}`;

    tree.children.push({
      type: 'mdxjsEsm',
      value: insertedCode,
      data: {
        estree: parse(insertedCode, {
          ecmaVersion: 2020,
          sourceType: 'module'
        }) as unknown as Program
      }
    });

    if (title) {
      const insertedTitle = `export const title = '${title}'`;
      tree.children.push({
        type: 'mdxjsEsm',
        value: insertedTitle,
        data: {
          estree: parse(insertedTitle, {
            ecmaVersion: 2020,
            sourceType: 'module'
          }) as unknown as Program
        }
      });
    }
  };
};
