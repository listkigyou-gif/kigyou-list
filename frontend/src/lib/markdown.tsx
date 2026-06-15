import React from 'react';

export function renderMarkdownToHTML(markdown: string): string {
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const parseInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 font-mono text-2xs rounded border border-slate-200/50 dark:border-slate-700">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary dark:text-secondary hover:underline font-bold">$1</a>');
  };

  const flushList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable) {
      if (tableRows.length > 0) {
        html += '<div class="overflow-x-auto my-6 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm"><table class="min-w-full border-collapse text-left text-xs sm:text-sm">';
        
        // Header row
        const headers = tableRows[0];
        html += '<thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-black"><tr>';
        headers.forEach(h => {
          html += `<th class="px-4 py-3 sm:px-6 font-extrabold">${parseInline(h.trim())}</th>`;
        });
        html += '</tr></thead>';

        // Body rows
        html += '<tbody class="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-[#1C2128]/40 text-slate-700 dark:text-slate-350">';
        // Skip header row and separator row (index 1 is typically `| :--- | :--- |`)
        for (let i = 2; i < tableRows.length; i++) {
          const cells = tableRows[i];
          html += '<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">';
          cells.forEach(c => {
            html += `<td class="px-4 py-3 sm:px-6">${parseInline(c.trim())}</td>`;
          });
          html += '</tr>';
        }
        html += '</tbody></table></div>';
      }
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // Horizontal Rule
    if (line === '---') {
      flushList();
      flushTable();
      html += '<hr class="my-8 border-slate-250 dark:border-slate-800" />';
      continue;
    }

    // Headings
    if (line.startsWith('## ')) {
      flushList();
      flushTable();
      html += `<h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white border-b border-slate-150 dark:border-slate-800 pb-2 mt-8 mb-4">${parseInline(line.substring(3))}</h2>`;
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      flushTable();
      html += `<h3 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-6 mb-3">${parseInline(line.substring(4))}</h3>`;
      continue;
    }

    // Lists
    if (line.startsWith('* ') || line.startsWith('- ')) {
      flushTable();
      if (!inList) {
        html += '<ul class="list-disc pl-5 my-4 text-xs sm:text-sm text-slate-750 dark:text-slate-300 space-y-2">';
        inList = true;
      }
      html += `<li>${parseInline(line.substring(2))}</li>`;
      continue;
    }

    // Tables
    if (line.startsWith('|')) {
      flushList();
      if (!inTable) {
        inTable = true;
      }
      // Parse columns
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    }

    // Plain Paragraph
    flushList();
    flushTable();
    html += `<p class="my-4 leading-relaxed text-xs sm:text-sm text-slate-700 dark:text-slate-350">${parseInline(line)}</p>`;
  }

  flushList();
  flushTable();

  return html;
}

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const html = renderMarkdownToHTML(content);
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
};
