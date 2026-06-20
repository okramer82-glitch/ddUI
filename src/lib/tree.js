/** Depth-first search of the folder tree by id. */
export function findNode(nodes, id) {
  for (const n of nodes || []) {
    if (n.id === id) return n;
    if (n.children) { const r = findNode(n.children, id); if (r) return r; }
  }
  return null;
}

/** Find the nearest ancestor folder node of `id` (null if top-level). */
export function findParentFolder(nodes, id, parent = null) {
  for (const n of nodes || []) {
    if (n.id === id) return parent && parent.type === "folder" ? parent : null;
    if (n.children) { const r = findParentFolder(n.children, id, n); if (r) return r; }
  }
  return null;
}

/** Direct sub-folder children of a folder node. */
export function childFolders(tree, id) {
  const node = findNode(tree, id);
  return (node?.children || []).filter((c) => c.type === "folder");
}
