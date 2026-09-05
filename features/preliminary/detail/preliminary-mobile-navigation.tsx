'use client';

import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryQuestionNav from '@/features/preliminary/detail/preliminary-question-nav';
import PreliminarySidebar from '@/features/preliminary/detail/preliminary-sidebar';
import {
  getPreliminaryQuestionAnchorId,
  getQuestionDisplayNumber,
} from '@/features/preliminary/lib/preliminary-utils';
import { Button } from '@/shared/components/ui/button';
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
import { useRef, useState } from 'react';

type Props = {
  paperId: string;
  data: PreliminaryDetailData;
};

export default function PreliminaryMobileNavigation({ paperId, data }: Props) {
  const t = useTranslations('preliminary');
  const [open, setOpen] = useState(false);
  const selectedQuestion = useRef<string | null>(null);
  const questions = data.paper.sections
    .flatMap((section) => section.questions)
    .map((question, index) => ({
      id: question.id,
      number: getQuestionDisplayNumber(question, index),
    }));

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
        onCloseAutoFocus={(event) => {
          if (!selectedQuestion.current) return;
          const target = document.getElementById(
            getPreliminaryQuestionAnchorId(selectedQuestion.current)
          );
          selectedQuestion.current = null;
          if (!target) return;
          event.preventDefault();
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: 'start' });
        }}
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
          <PreliminaryQuestionNav
            questions={questions}
            onNavigate={(id) => {
              selectedQuestion.current = id;
              setOpen(false);
            }}
          />
          <PreliminarySidebar
            paperId={paperId}
            data={data}
            owner={data.owner}
            canEdit={data.canEdit}
            showQuestionNav={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
