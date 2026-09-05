'use client';

import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryEditActions from '@/features/preliminary/detail/preliminary-edit-actions';
import PreliminaryNavPanel, {
  focusPreliminaryQuestion,
} from '@/features/preliminary/detail/preliminary-nav-panel';
import PreliminaryPaperMeta from '@/features/preliminary/detail/preliminary-paper-meta';
import { getPreliminaryNavQuestions } from '@/features/preliminary/lib/preliminary-utils';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { ListOrdered, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Props = {
  paperId: string;
  data: PreliminaryDetailData;
};

export default function PreliminaryMobileNavigation({ paperId, data }: Props) {
  const t = useTranslations('preliminary');
  const [open, setOpen] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(
    null
  );
  const questions = getPreliminaryNavQuestions(data.paper.sections);

  const handleSelectQuestion = (questionId: string) => {
    setPendingQuestionId(questionId);
    setOpen(false);
  };

  const handleCloseAutoFocus = (event: Event) => {
    if (!pendingQuestionId) return;
    const questionId = pendingQuestionId;
    setPendingQuestionId(null);
    if (focusPreliminaryQuestion(questionId)) event.preventDefault();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-w-0 flex-1 px-3 md:hidden"
        >
          <ListOrdered />
          <span className="truncate">{t('directory')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <SheetClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 size-11"
            aria-label={t('closeNavigation')}
          >
            <X />
          </Button>
        </SheetClose>
        <SheetHeader className="pr-16">
          <SheetTitle>{t('directory')}</SheetTitle>
          <SheetDescription className="break-words">
            {data.paper.title}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-4 pb-6">
          <PreliminaryNavPanel
            questions={questions}
            onSelectQuestion={handleSelectQuestion}
          />
          <Separator />
          {data.canEdit && <PreliminaryEditActions paperId={paperId} />}
          {data.canEdit && <Separator />}
          <PreliminaryPaperMeta paperId={paperId} data={data} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
