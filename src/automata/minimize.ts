import type { DFA, DFAState, DFATransition, DFAMinimizationResult, StateId } from './types';
import { completeDfa } from './completeDfa';

/**
 * Minimizes a DFA using partition refinement.
 * Preserves distinct accepting constellation label sets so recognition identities are never conflated.
 */
export function minimizeDfa(inputDfa: DFA): DFAMinimizationResult {
  // 1. Ensure complete DFA so transition function is total
  const completed = completeDfa(inputDfa);
  const alphabet = completed.alphabet;

  // 2. Filter unreachable states from initial state
  const reachableStates = getReachableStates(completed);
  const activeStates = completed.states.filter(s => reachableStates.has(s.id));

  // Build transition map for O(1) step: (stateId, symbol) -> nextStateId
  const transMap = new Map<string, StateId>();
  for (const t of completed.transitions) {
    if (reachableStates.has(t.from) && reachableStates.has(t.to)) {
      transMap.set(`${t.from}:::${t.symbol}`, t.to);
    }
  }

  // 3. Initial Partition P0:
  // - Non-accepting non-dead states
  // - Dead state (in its own block)
  // - Accepting states partitioned by their exact sorted acceptingLabels string
  const partitionMap = new Map<StateId, number>(); // stateId -> blockIndex
  const blocks: StateId[][] = [];

  const nonAcceptingBlock: StateId[] = [];
  const deadBlock: StateId[] = [];
  const acceptingGroups = new Map<string, StateId[]>();

  for (const state of activeStates) {
    if (state.isDead) {
      deadBlock.push(state.id);
    } else if (!state.isAccepting) {
      nonAcceptingBlock.push(state.id);
    } else {
      const labelKey = [...state.acceptingLabels].sort().join('###');
      if (!acceptingGroups.has(labelKey)) {
        acceptingGroups.set(labelKey, []);
      }
      acceptingGroups.get(labelKey)!.push(state.id);
    }
  }

  if (nonAcceptingBlock.length > 0) blocks.push(nonAcceptingBlock);
  if (deadBlock.length > 0) blocks.push(deadBlock);
  for (const group of acceptingGroups.values()) {
    blocks.push(group);
  }

  // Assign initial block indices
  blocks.forEach((block, idx) => {
    block.forEach(sid => partitionMap.set(sid, idx));
  });

  // 4. Partition Refinement Loop (Hopcroft / Moore style)
  let changed = true;
  let currentBlocks = blocks;

  while (changed) {
    changed = false;
    const nextBlocks: StateId[][] = [];

    for (const block of currentBlocks) {
      if (block.length <= 1) {
        nextBlocks.push(block);
        continue;
      }

      // Group states in this block by their transition signature: (symbol -> targetBlockIndex)
      const subGroups = new Map<string, StateId[]>();

      for (const stateId of block) {
        // Construct signature string
        const sigParts: string[] = [];
        for (const sym of alphabet) {
          const targetStateId = transMap.get(`${stateId}:::${sym}`);
          const targetBlockIdx = targetStateId ? partitionMap.get(targetStateId) ?? -1 : -1;
          sigParts.push(`${sym}=>${targetBlockIdx}`);
        }
        const sig = sigParts.join('|');

        if (!subGroups.has(sig)) {
          subGroups.set(sig, []);
        }
        subGroups.get(sig)!.push(stateId);
      }

      const splitBlocks = Array.from(subGroups.values());
      if (splitBlocks.length > 1) {
        changed = true;
      }
      splitBlocks.forEach(sb => nextBlocks.push(sb));
    }

    currentBlocks = nextBlocks;
    // Update partitionMap with new indices
    partitionMap.clear();
    currentBlocks.forEach((block, idx) => {
      block.forEach(sid => partitionMap.set(sid, idx));
    });
  }

  // 5. Build Minimized DFA
  // Each block in currentBlocks forms one state in the minimized DFA
  const stateIdToMinId: Record<StateId, StateId> = {};
  const minimizedStates: DFAState[] = [];
  const stateLookup = new Map(activeStates.map(s => [s.id, s]));

  let minInitialStateId: StateId = '';
  let minDeadStateId: StateId | undefined;

  currentBlocks.forEach((block, idx) => {
    // Sort block for determinism
    block.sort();
    const repStateId = block[0];
    const repState = stateLookup.get(repStateId)!;
    const minStateId: StateId = `m${idx}`;

    block.forEach(origId => {
      stateIdToMinId[origId] = minStateId;
    });

    const isInitial = block.some(sid => sid === completed.initialState);
    if (isInitial) {
      minInitialStateId = minStateId;
    }

    const isDead = block.some(sid => stateLookup.get(sid)?.isDead);
    if (isDead) {
      minDeadStateId = minStateId;
    }

    const isAccepting = repState.isAccepting;
    const acceptingLabels = [...repState.acceptingLabels];

    // Merge NFA subsets for display
    const mergedNfaSubsets = new Set<StateId>();
    block.forEach(sid => {
      const s = stateLookup.get(sid);
      if (s) s.nfaSubset.forEach(nid => mergedNfaSubsets.add(nid));
    });

    const name = isDead
      ? 'q_dead (Trap)'
      : block.length > 1
        ? `[${block.join(', ')}]`
        : repState.name;

    minimizedStates.push({
      id: minStateId,
      name,
      isInitial,
      isAccepting,
      isDead,
      acceptingLabels,
      nfaSubset: Array.from(mergedNfaSubsets).sort(),
    });
  });

  // Construct minimized transitions (deduplicated)
  const minTransitions: DFATransition[] = [];
  const minTransSet = new Set<string>();

  for (const block of currentBlocks) {
    const repStateId = block[0];
    const fromMinId = stateIdToMinId[repStateId];

    for (const sym of alphabet) {
      const targetOrigId = transMap.get(`${repStateId}:::${sym}`);
      if (targetOrigId) {
        const toMinId = stateIdToMinId[targetOrigId];
        const key = `${fromMinId}:::${sym}:::${toMinId}`;
        if (!minTransSet.has(key)) {
          minTransSet.add(key);
          minTransitions.push({
            from: fromMinId,
            to: toMinId,
            symbol: sym,
          });
        }
      }
    }
  }

  const minAcceptingStates = minimizedStates.filter(s => s.isAccepting).map(s => s.id);

  const minimizedDfa: DFA = {
    states: minimizedStates,
    alphabet: [...alphabet],
    initialState: minInitialStateId,
    transitions: minTransitions,
    acceptingStates: minAcceptingStates,
    isComplete: true,
    deadStateId: minDeadStateId,
  };

  return {
    minimizedDfa,
    originalStateCount: completed.states.length,
    minimizedStateCount: minimizedStates.length,
    partitions: currentBlocks,
    partitionMap: stateIdToMinId,
  };
}

/**
 * Finds all states reachable from the initial state using BFS.
 */
function getReachableStates(dfa: DFA): Set<StateId> {
  const reachable = new Set<StateId>([dfa.initialState]);
  const queue: StateId[] = [dfa.initialState];

  const adj = new Map<StateId, StateId[]>();
  for (const t of dfa.transitions) {
    if (!adj.has(t.from)) adj.set(t.from, []);
    adj.get(t.from)!.push(t.to);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const targets = adj.get(curr) || [];
    for (const target of targets) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  return reachable;
}
