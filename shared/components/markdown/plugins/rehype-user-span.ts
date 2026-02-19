import ServerApis from '@/api/server/method';
import type { BaseUser } from '@/shared/types/user';
import { visit } from 'unist-util-visit';

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

type HastParent = {
  children: HastNode[];
};

type AnchorCandidate = {
  parent: HastParent;
  index: number;
  uid: number;
};

const USER_HREF_RE = /^\/user\/(\d+)$/;

function parseUserUid(href: unknown): null | number {
  if (typeof href !== 'string') return null;
  const match = USER_HREF_RE.exec(href);
  if (!match) return null;
  return Number.parseInt(match[1]!, 10);
}

function toUserSpanNode(user: BaseUser): HastNode {
  return {
    type: 'element',
    tagName: 'user-span',
    properties: {
      'data-uid': String(user._id),
      'data-uname': user.uname,
      'data-mail': user.mail,
      'data-avatar': user.avatar,
    },
    children: [],
  };
}

export default function rehypeUserSpan() {
  return async (tree: HastNode) => {
    const candidates: AnchorCandidate[] = [];
    const uidSet = new Set<number>();

    visit(tree, 'element', (node: HastNode, index, parent) => {
      if (node.tagName !== 'a') return;
      if (!parent || typeof index !== 'number') return;

      const uid = parseUserUid(node.properties?.href);
      if (uid === null) return;

      uidSet.add(uid);
      candidates.push({
        parent: parent as HastParent,
        index,
        uid,
      });
    });

    if (uidSet.size === 0) return;

    try {
      const response = await ServerApis.UI.getMedia({
        uids: Array.from(uidSet),
      });

      const udict = response.udict;

      for (const candidate of candidates) {
        const user = udict[candidate.uid];
        if (!user) continue;
        candidate.parent.children[candidate.index] = toUserSpanNode(user);
      }
    } catch {
      // Keep original markdown links when media fetch fails.
    }
  };
}
