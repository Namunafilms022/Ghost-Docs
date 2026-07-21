import type { ScannedFile, FolderTreeNode } from '@ghost-docs/types';

export function buildFolderTree(files: ScannedFile[], rootPath: string): FolderTreeNode {
  const root: FolderTreeNode = {
    name: rootPath.split('/').pop() || rootPath.split('\\').pop() || 'root',
    path: '.', type: 'directory', children: [],
  };

  for (const file of files) {
    const parts = file.relativePath.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');
      if (isLast) {
        current.children?.push({ name: parts[i], path: currentPath, type: 'file', size: file.size });
      } else {
        let existing = current.children?.find((c) => c.name === parts[i] && c.type === 'directory');
        if (!existing) {
          existing = { name: parts[i], path: currentPath, type: 'directory', children: [] };
          current.children?.push(existing);
        }
        current = existing;
      }
    }
  }

  sortTree(root);
  return root;
}

function sortTree(node: FolderTreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) sortTree(child);
}

export function renderTreeAscii(node: FolderTreeNode, prefix = ''): string {
  let result = '';
  for (let i = 0; i < (node.children ?? []).length; i++) {
    const child = (node.children ?? [])[i];
    const isLast = i === (node.children ?? []).length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    result += prefix + connector + child.name;
    if (child.type === 'directory') result += '/';
    if (child.type === 'file' && child.size !== undefined) result += ` (${formatSize(child.size)})`;
    result += '\n';
    if (child.children) result += renderTreeAscii(child, nextPrefix);
  }
  return result;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
