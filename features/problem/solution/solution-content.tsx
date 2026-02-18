import SolutionList from './solution-list';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type Props = {
  data: ProblemSolutionResponse;
};

export default async function SolutionContent({ data }: Props) {
  const user = await getUser();
  const allowCreate =
    !!user?._id && hasPerm(user, PERM.PERM_CREATE_PROBLEM_SOLUTION);
  const allowEditAny =
    !!user?._id && hasPerm(user, PERM.PERM_EDIT_PROBLEM_SOLUTION);
  const allowEditSelf =
    !!user?._id && hasPerm(user, PERM.PERM_EDIT_PROBLEM_SOLUTION_SELF);
  const allowDeleteAny =
    !!user?._id && hasPerm(user, PERM.PERM_DELETE_PROBLEM_SOLUTION);
  const allowDeleteSelf =
    !!user?._id && hasPerm(user, PERM.PERM_DELETE_PROBLEM_SOLUTION_SELF);
  const pid = data.pdoc.pid ?? data.pdoc.docId;

  return (
    <div className="space-y-4">
      {allowCreate && (
        <div className="text-foreground flex items-center">
          <span className="text-muted-foreground">没有我的做法？</span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/problem/${pid}/solution/create`}>
              <Plus className="size-4" />
              创建题解
            </Link>
          </Button>
        </div>
      )}
      <Separator />
      <SolutionList
        data={data}
        viewerId={user?._id}
        allowEditAny={allowEditAny}
        allowEditSelf={allowEditSelf}
        allowDeleteAny={allowDeleteAny}
        allowDeleteSelf={allowDeleteSelf}
      />
    </div>
  );
}
