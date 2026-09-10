/**
 * Walks every Decision Engine tree and asserts the graph is sound:
 *   - every `next` target resolves to a real node id (or the __hub__ sentinel)
 *   - every node is reachable from the module's start node
 *   - step/total pairs are internally consistent
 *   - the registry's totalSteps matches the tree's declared total
 *
 * Run with:  npx tsx scripts/validate-engines.mts
 */
import { ENGINE_MODULES } from '../src/lib/engines/registry';
import { getTree, getStartNode } from '../src/lib/engines/loader';
import type { TreeNode } from '../src/lib/engines/types';

const HUB = '__hub__';
let errors = 0;
let checked = 0;

function targetsOf(node: TreeNode): string[] {
  switch (node.type) {
    case 'q':  return node.opts.map(o => o.next);
    case 'ms': return [node.next];
    case 'summary': return [];
    default:   return [(node as { next: string }).next];
  }
}

for (const mod of ENGINE_MODULES) {
  if (mod.status !== 'live') continue;
  const tree = getTree(mod.id);
  const start = getStartNode(mod.id);

  if (!tree || !start) {
    console.error(`✗ ${mod.id}: no tree registered in loader.ts`);
    errors++;
    continue;
  }

  const ids = new Set(Object.keys(tree));

  // 1. Dangling `next` targets.
  for (const [id, node] of Object.entries(tree)) {
    if (node.id !== id) {
      console.error(`✗ ${mod.id}/${id}: node.id is "${node.id}" but its key is "${id}"`);
      errors++;
    }
    for (const t of targetsOf(node)) {
      checked++;
      if (t !== HUB && !ids.has(t)) {
        console.error(`✗ ${mod.id}/${id}: next -> "${t}" does not exist`);
        errors++;
      }
    }
  }

  // 2. Reachability from the start node.
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.pop()!;
    for (const t of targetsOf(tree[cur])) {
      if (t === HUB || seen.has(t)) continue;
      seen.add(t);
      queue.push(t);
    }
  }
  for (const id of ids) {
    if (!seen.has(id)) {
      console.error(`✗ ${mod.id}/${id}: unreachable from start node "${start}"`);
      errors++;
    }
  }

  // 3. step/total consistency, and agreement with the registry.
  const totals = new Set<number>();
  for (const node of Object.values(tree)) {
    if (node.step && node.total) {
      totals.add(node.total);
      if (node.step > node.total) {
        console.error(`✗ ${mod.id}/${node.id}: step ${node.step} exceeds total ${node.total}`);
        errors++;
      }
    }
  }
  if (totals.size > 1) {
    console.error(`✗ ${mod.id}: inconsistent totals across nodes: ${[...totals].join(', ')}`);
    errors++;
  }
  const total = [...totals][0];
  if (total !== undefined && mod.totalSteps !== undefined && total !== mod.totalSteps) {
    console.error(`✗ ${mod.id}: registry totalSteps=${mod.totalSteps} but tree declares ${total}`);
    errors++;
  }

  // 4. Every module must be able to finish. Two valid terminal forms:
  //    - a node routing to the __hub__ sentinel (EngineRunner synthesises
  //      the generic WorkflowSummary), or
  //    - an explicit `summary` node (WGS uses its own WgsSummaryNode).
  const terminates =
    Object.values(tree).some(n => targetsOf(n).includes(HUB)) ||
    Object.values(tree).some(n => n.type === 'summary');
  if (!terminates) {
    console.error(`✗ ${mod.id}: no route to ${HUB} and no summary node — the module can never finish`);
    errors++;
  }

  console.log(`  ✓ ${mod.id.padEnd(22)} ${ids.size} nodes, ${total ?? '?'} steps`);
}

console.log(`\n${checked} edges checked across ${ENGINE_MODULES.filter(m => m.status === 'live').length} live modules`);
if (errors > 0) {
  console.error(`\n${errors} problem(s) found`);
  process.exit(1);
}
console.log('All engine trees valid.');
