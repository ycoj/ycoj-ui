'use client';

import ClientApis from '@/api/client/method';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import type { ObjectId } from '@/shared/types/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  problemId: number;
  routePid: string;
} & (
  | {
      mode?: 'create';
      psid?: never;
      initialContent?: string;
    }
  | {
      mode: 'edit';
      psid: ObjectId;
      initialContent: string;
    }
);

const schema = z.object({
  content: z.string().trim().min(1, '请输入题解内容'),
});

type FormValues = z.infer<typeof schema>;

export default function SolutionCreateForm({
  problemId,
  routePid,
  mode = 'create',
  initialContent = '',
  psid,
}: Props) {
  const defaultContent = mode === 'edit' ? initialContent : '';
  const router = useRouter();
  const {
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      content: defaultContent,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const actionText = mode === 'edit' ? '保存' : '发布';

    try {
      if (mode === 'edit' && psid) {
        const res = await ClientApis.Problem.editProblemSolution(
          problemId,
          psid,
          values.content
        ).send();

        if (res?.psdoc?.docId) {
          router.back();
          return;
        }
      } else {
        const res = await ClientApis.Problem.submitProblemSolution(
          problemId,
          values.content
        ).send();

        if (res?.psid) {
          router.push(`/problem/${routePid}/solution`);
          return;
        }
      }

      setError('root.serverError', {
        type: 'server',
        message: `${actionText}失败，请稍后重试`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${actionText}失败，请稍后重试`;
      setError('root.serverError', {
        type: 'server',
        message,
      });
    }
  };

  const submitText = mode === 'edit' ? '保存' : '发布';
  const submittingText = mode === 'edit' ? '保存中...' : '发布中...';

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      data-llm-visible="true"
    >
      <Field>
        <FieldLabel htmlFor="content">题解内容</FieldLabel>
        <FieldContent>
          <MarkdownEditor
            {...register('content')}
            defaultValue={defaultContent}
          />
        </FieldContent>
        <FieldError errors={[errors.content]} />
      </Field>

      <FieldError errors={[errors.root?.serverError]} />

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="gap-1.5">
          <Navigation strokeWidth={2} />
          {isSubmitting ? submittingText : submitText}
        </Button>
        <Button asChild variant="secondary" className="gap-1.5">
          <Link href={`/problem/${routePid}/solution`}>
            <ArrowLeft strokeWidth={2} />
            <span data-llm-text="返回">返回</span>
          </Link>
        </Button>
      </div>
    </form>
  );
}
