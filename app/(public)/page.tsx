import { getUser } from '@/features/user/lib/get-user';
import { Button } from '@/shared/components/ui/button';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '首页',
};

export default async function IndexPage() {
  const siteName = process.env.SITE_NAME ?? '';
  const user = await getUser();
  if (user._id > 0) {
    redirect('/home');
  }

  return (
    <div className="bg-linear-to-b from-background via-background to-muted/30">
      <div
        className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-10 sm:px-6"
        id="landing-container"
      >
        <header className="flex items-center justify-between -ml-4">
          <Image
            src="/nav-logo-small_light.png"
            alt={`${siteName} Logo`}
            width={160}
            height={44}
            priority
            sizes="160px"
            className="h-auto w-[140px] sm:w-[160px]"
          />
          <Button asChild className="hidden sm:inline-flex" size="lg">
            <Link href="/login">登录</Link>
          </Button>
        </header>

        <main className="mt-10 flex flex-1 flex-col gap-6 sm:mt-16 sm:gap-8 md:mt-0 md:justify-center">
          <div className="space-y-6 md:space-y-2">
            <h1 className="text-balance text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              <span className="text-emerald-500">现代</span>、
              <span className="text-sky-700">原生智能</span>的在线测评系统
            </h1>
            <p className="max-w-prose text-pretty text-base text-muted-foreground sm:text-lg">
              准备好在{' '}
              <span className="font-medium text-foreground">{siteName}</span>{' '}
              上体验深度集成的人工智能所带来的高效学习。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 md:hidden">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-sm font-medium text-foreground">
                移动端友好
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                适合随时随地刷题、查看评测结果。
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-sm font-medium text-foreground">
                评测更透明
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                更清晰的状态与反馈，少走弯路。
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-sm font-medium text-foreground">
                AI 深度集成
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                更高效地定位问题、总结知识点。
              </div>
            </div>
          </div>
        </main>

        <div className="mt-auto pt-10">
          <div className="pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:hidden">
            <Button asChild className="w-full" size="lg">
              <Link href="/login">登录</Link>
            </Button>
          </div>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <p>登录后可同步进度、提交记录与个人信息。</p>
            <p>
              Powered by{' '}
              <a
                href="https://docs.hydro.ac"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Hydro
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
