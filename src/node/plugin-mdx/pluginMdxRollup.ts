import pluginMdx from '@mdx-js/rollup';
import remarkPluginGFM from 'remark-gfm';
import rehypePluginAutolinkHeadings from 'rehype-autolink-headings';
import rehypePluginSlug from 'rehype-slug';
import remarkPluginMDXFrontMatter from 'remark-mdx-frontmatter';
import remarkPluginFrontmatter from 'remark-frontmatter';
import { rehypePluginPreWrapper } from './rehypePlugins/preWrapper';
import { rehypePluginShiki } from './rehypePlugins/shiki';
import shiki from 'shiki';

export async function pluginMdxRollup() {
  return [
    pluginMdx({
      remarkPlugins: [
        remarkPluginGFM,
        [remarkPluginMDXFrontMatter, { name: 'frontmatter' }],
        remarkPluginFrontmatter
      ],
      rehypePlugins: [
        rehypePluginSlug,
        [
          rehypePluginAutolinkHeadings,
          {
            properties: {
              class: 'header-anchor'
            },
            content: {
              type: 'text',
              value: '#'
            }
          }
        ],
        rehypePluginPreWrapper,
        [
          rehypePluginShiki,
          {
            highlighter: await shiki.getHighlighter({
              theme: 'nord'
            })
          }
        ]
      ]
    })
  ];
}
