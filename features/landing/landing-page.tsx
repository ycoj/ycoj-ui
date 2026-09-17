'use client';

import SiteFooter from '@/shared/components/site-footer';
import ThemeLogo from '@/shared/components/theme-logo';
import { Button } from '@/shared/components/ui/button';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  Binary,
  BookOpen,
  Bot,
  Braces,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronDown,
  CircleGauge,
  Code2,
  Cpu,
  GraduationCap,
  Layers3,
  MessageSquareText,
  MonitorSmartphone,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  WandSparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = { siteName: string };
type FeatureKey =
  'problems' | 'training' | 'contests' | 'homework' | 'ranking' | 'community';

const features: { icon: LucideIcon; key: FeatureKey; tone: string }[] = [
  { icon: BookOpen, key: 'problems', tone: 'bg-cyan-400/10 text-cyan-300' },
  {
    icon: GraduationCap,
    key: 'training',
    tone: 'bg-violet-400/10 text-violet-300',
  },
  { icon: Swords, key: 'contests', tone: 'bg-amber-400/10 text-amber-300' },
  {
    icon: Layers3,
    key: 'homework',
    tone: 'bg-emerald-400/10 text-emerald-300',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    key: 'ranking',
    tone: 'bg-rose-400/10 text-rose-300',
  },
  {
    icon: MessageSquareText,
    key: 'community',
    tone: 'bg-sky-400/10 text-sky-300',
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center" data-reveal>
      <p className="mb-4 font-mono text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase sm:text-sm">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-400 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function TerminalVisual() {
  const t = useTranslations('landing');

  return (
    <div className="relative mx-auto w-full max-w-xl" data-hero-visual>
      <div
        className="absolute -inset-8 rounded-full bg-cyan-400/10 blur-3xl"
        data-float
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-300/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">
            {t('hero.terminalLabel')}
          </span>
          <Radio className="size-3.5 text-emerald-400" aria-hidden="true" />
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-4" data-status-line>
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
              <Code2 className="size-4 text-cyan-300" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-slate-300">
                  solution.cpp
                </span>
                <span className="rounded-full bg-cyan-400/10 px-2 py-1 font-mono text-[10px] text-cyan-300">
                  {t('hero.compiling')}
                </span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-4/5 origin-left rounded-full bg-linear-to-r from-cyan-400 to-blue-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2" data-status-line>
            {(['case1', 'case2', 'case3'] as const).map((key, index) => (
              <div
                key={key}
                className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3"
              >
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Check className="size-3" aria-hidden="true" />
                  <span className="font-mono text-[10px]">#{index + 1}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-200">
                  {t(`hero.${key}`)}
                </p>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3"
            data-status-line
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-300" aria-hidden="true" />
              <span className="text-xs text-slate-300">
                {t('hero.aiScanning')}
              </span>
            </div>
            <span className="font-mono text-xs text-emerald-300">
              {t('hero.ready')}
            </span>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-3 -bottom-5 hidden items-center gap-3 rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:flex"
        data-float-card
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/10">
          <Zap className="size-4 text-emerald-300" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] tracking-wider text-slate-500 uppercase">
            {t('hero.verdict')}
          </p>
          <p className="text-sm font-semibold text-emerald-300">Accepted</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ siteName }: Props) {
  const t = useTranslations('landing');
  const root = useRef<HTMLDivElement>(null);
  const displayName = siteName || t('brandFallback');

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        {
          desktop: '(min-width: 768px)',
          mobile: '(max-width: 767px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { desktop, reduceMotion } = context.conditions as {
            desktop: boolean;
            mobile: boolean;
            reduceMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(
              '[data-hero], [data-hero-visual], [data-status-line], [data-reveal], [data-feature-card]',
              { clearProps: 'all' }
            );
            return;
          }

          const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
          intro
            .from('[data-hero]', {
              autoAlpha: 0,
              y: 24,
              duration: 0.8,
              stagger: 0.09,
            })
            .from(
              '[data-hero-visual]',
              {
                autoAlpha: 0,
                x: desktop ? 32 : 0,
                y: desktop ? 0 : 20,
                duration: 0.9,
              },
              '-=0.55'
            )
            .from(
              '[data-status-line]',
              { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.08 },
              '-=0.45'
            );

          gsap.to('[data-float]', {
            scale: 1.12,
            opacity: 0.65,
            duration: 3.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });

          if (desktop) {
            gsap.to('[data-float-card]', {
              y: -10,
              duration: 2.4,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
            gsap.to('[data-parallax]', {
              yPercent: -12,
              ease: 'none',
              scrollTrigger: {
                trigger: '[data-speed-section]',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });
          }

          gsap.utils
            .toArray<HTMLElement>('[data-reveal]')
            .forEach((element) => {
              gsap.from(element, {
                y: desktop ? 40 : 24,
                duration: 0.75,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: element,
                  start: 'top 84%',
                  once: true,
                },
              });
            });

          gsap.from('[data-feature-card]', {
            y: 28,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '[data-feature-grid]',
              start: 'top 82%',
              once: true,
            },
          });

          gsap.from('[data-flow-line]', {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.1,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '[data-speed-visual]',
              start: 'top 78%',
              once: true,
            },
          });
        }
      );

      return () => media.revert();
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      className="dark min-h-dvh overflow-x-clip bg-[#050914] text-slate-100 selection:bg-cyan-300 selection:text-slate-950"
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.12),transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10">
        <header
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10"
          data-hero
        >
          <ThemeLogo
            alt={t('logoAlt', { siteName: displayName })}
            width={290}
            height={87}
            sizes="150px"
            className="h-auto w-[138px] sm:w-[154px]"
          />
          <nav
            aria-label={t('navigationLabel')}
            className="flex items-center gap-2 sm:gap-3"
          >
            <Link
              href="#capabilities"
              className="hidden px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white sm:block"
            >
              {t('navCapabilities')}
            </Link>
            <Button
              asChild
              size="lg"
              className="h-10 rounded-full bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
            >
              <Link href="/login">{t('login')}</Link>
            </Button>
          </nav>
        </header>

        <main>
          <section className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-7xl items-center gap-14 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:pt-4">
            <div className="max-w-3xl">
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 font-mono text-xs text-cyan-200"
                data-hero
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
                </span>
                {t('hero.eyebrow')}
              </div>
              <h1
                className="text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-[5.4rem]"
                data-hero
              >
                {t.rich('hero.title', {
                  speed: (chunks) => (
                    <span className="bg-linear-to-r from-cyan-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                      {chunks}
                    </span>
                  ),
                  smart: (chunks) => (
                    <span className="text-cyan-200">{chunks}</span>
                  ),
                })}
              </h1>
              <p
                className="mt-7 max-w-xl text-pretty text-lg leading-8 text-slate-400 sm:text-xl"
                data-hero
              >
                {t('hero.description', { siteName: displayName })}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row" data-hero>
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-cyan-300 px-7 text-base text-slate-950 shadow-lg shadow-cyan-500/15 hover:bg-cyan-200 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
                >
                  <Link href="/login">
                    {t('hero.primaryCta')}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-white/12 bg-white/4 px-7 text-base text-slate-200 hover:bg-white/8 hover:text-white dark:bg-white/4 dark:hover:bg-white/8"
                >
                  <Link href="#capabilities">
                    {t('hero.secondaryCta')}
                    <ChevronDown aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <div
                className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500"
                data-hero
              >
                {(['instant', 'transparent', 'crossDevice'] as const).map(
                  (key) => (
                    <span key={key} className="flex items-center gap-2">
                      <Check
                        className="size-3.5 text-emerald-300"
                        aria-hidden="true"
                      />
                      {t(`hero.${key}`)}
                    </span>
                  )
                )}
              </div>
            </div>
            <TerminalVisual />
          </section>

          <section
            id="capabilities"
            className="border-y border-white/6 bg-white/2 py-24 sm:py-32"
            data-speed-section
          >
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
              <SectionHeading
                eyebrow={t('speed.eyebrow')}
                title={t('speed.title')}
                description={t('speed.description')}
              />
              <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="grid gap-4" data-reveal>
                  {(['submit', 'evaluate', 'feedback'] as const).map(
                    (key, index) => (
                      <div
                        key={key}
                        className="group relative overflow-hidden rounded-2xl border border-white/8 bg-slate-950/50 p-5 transition-colors hover:border-cyan-300/20 hover:bg-slate-950/80"
                      >
                        <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-cyan-300/50 to-transparent" />
                        <div className="flex items-start gap-4">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-sm text-cyan-300">
                            0{index + 1}
                          </span>
                          <div>
                            <h3 className="font-semibold text-white">
                              {t(`speed.steps.${key}.title`)}
                            </h3>
                            <p className="mt-1.5 text-sm leading-6 text-slate-400">
                              {t(`speed.steps.${key}.description`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div
                  className="relative rounded-3xl border border-white/8 bg-slate-950/60 p-6 sm:p-8"
                  data-speed-visual
                  data-parallax
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs text-slate-500 uppercase">
                        {t('speed.visual.queue')}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {t('speed.visual.live')}
                      </p>
                    </div>
                    <CircleGauge
                      className="size-8 text-cyan-300"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-5">
                    {(['compile', 'samples', 'judge'] as const).map(
                      (key, index) => (
                        <div key={key}>
                          <div className="mb-2 flex justify-between text-xs">
                            <span className="text-slate-300">
                              {t(`speed.visual.${key}`)}
                            </span>
                            <span className="font-mono text-emerald-300">
                              {t(`speed.visual.status${index + 1}`)}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-cyan-400 to-indigo-400"
                              style={{ width: `${100 - index * 16}%` }}
                              data-flow-line
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-400/7 p-4">
                      <ShieldCheck
                        className="size-5 text-emerald-300"
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-xs text-slate-500">
                        {t('speed.visual.resultLabel')}
                      </p>
                      <p className="mt-1 font-semibold text-emerald-300">
                        {t('speed.visual.result')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-violet-400/7 p-4">
                      <Binary
                        className="size-5 text-violet-300"
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-xs text-slate-500">
                        {t('speed.visual.detailLabel')}
                      </p>
                      <p className="mt-1 font-semibold text-violet-200">
                        {t('speed.visual.detail')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
              <SectionHeading
                eyebrow={t('ai.eyebrow')}
                title={t('ai.title')}
                description={t('ai.description')}
              />
              <div className="mt-16 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div
                  className="relative overflow-hidden rounded-3xl border border-violet-300/12 bg-linear-to-br from-violet-500/10 via-slate-950/60 to-cyan-500/8 p-6 sm:p-8"
                  data-reveal
                >
                  <div className="absolute -top-20 -right-20 size-56 rounded-full bg-violet-500/10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-violet-400/12">
                        <Bot
                          className="size-5 text-violet-200"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {t('ai.analysisTitle')}
                        </p>
                        <p className="font-mono text-xs text-violet-300">
                          {t('ai.analysisStatus')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <AiCard
                        icon={Braces}
                        title={t('ai.locateTitle')}
                        description={t('ai.locateDescription')}
                        iconClassName="text-cyan-300"
                      />
                      <AiCard
                        icon={WandSparkles}
                        title={t('ai.summarizeTitle')}
                        description={t('ai.summarizeDescription')}
                        iconClassName="text-violet-300"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-5">
                  <CompactCard
                    icon={Cpu}
                    title={t('ai.generateTitle')}
                    description={t('ai.generateDescription')}
                    iconClassName="text-emerald-300"
                  />
                  <CompactCard
                    icon={Network}
                    title={t('ai.learnTitle')}
                    description={t('ai.learnDescription')}
                    iconClassName="text-sky-300"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-white/6 bg-white/2 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
              <SectionHeading
                eyebrow={t('features.eyebrow')}
                title={t('features.title')}
                description={t('features.description')}
              />
              <div
                className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-feature-grid
              >
                {features.map(({ icon: Icon, key, tone }) => (
                  <article
                    key={key}
                    className="group rounded-2xl border border-white/8 bg-slate-950/45 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-slate-950/75"
                    data-feature-card
                  >
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl ${tone}`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-lg font-semibold text-white">
                      {t(`features.items.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {t(`features.items.${key}.description`)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="py-24 sm:py-32">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
              <div data-reveal>
                <p className="font-mono text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase sm:text-sm">
                  {t('device.eyebrow')}
                </p>
                <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {t('device.title')}
                </h2>
                <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-slate-400 sm:text-lg">
                  {t('device.description')}
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <DevicePoint
                    icon={MonitorSmartphone}
                    text={t('device.responsive')}
                    iconClassName="text-cyan-300"
                  />
                  <DevicePoint
                    icon={ShieldCheck}
                    text={t('device.synced')}
                    iconClassName="text-emerald-300"
                  />
                </div>
              </div>
              <DeviceVisual />
            </div>
          </section>

          <section className="px-5 pb-10 sm:px-8 sm:pb-16 lg:px-10">
            <div
              className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/12 via-indigo-500/8 to-violet-500/12 px-6 py-16 text-center sm:px-12 sm:py-24"
              data-reveal
            >
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,211,238,0.22),transparent_45%)]"
                aria-hidden="true"
              />
              <div className="relative mx-auto max-w-3xl">
                <Trophy
                  className="mx-auto size-9 text-amber-300"
                  aria-hidden="true"
                />
                <h2 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {t('cta.title')}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-pretty leading-7 text-slate-300">
                  {t('cta.description')}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-9 h-12 rounded-full bg-cyan-300 px-7 text-base text-slate-950 hover:bg-cyan-200 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
                >
                  <Link href="/login">
                    {t('cta.button')}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-8 text-xs text-slate-500 sm:px-8 lg:px-10">
          <p>{t('footer', { siteName: displayName })}</p>
          <SiteFooter />
        </footer>
      </div>
    </div>
  );
}

function AiCard({
  icon: Icon,
  title,
  description,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-5">
      <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
      <h3 className="mt-5 font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function CompactCard({
  icon: Icon,
  title,
  description,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName: string;
}) {
  return (
    <div
      className="rounded-3xl border border-white/8 bg-white/3 p-6"
      data-reveal
    >
      <Icon className={`size-6 ${iconClassName}`} aria-hidden="true" />
      <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function DevicePoint({
  icon: Icon,
  text,
  iconClassName,
}: {
  icon: LucideIcon;
  text: string;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-4">
      <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
      <span className="text-sm text-slate-200">{text}</span>
    </div>
  );
}

function DeviceVisual() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-lg items-end justify-center gap-4"
      data-reveal
      aria-hidden="true"
    >
      <div className="relative w-[72%] rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
        <div className="aspect-4/3 overflow-hidden rounded-xl bg-linear-to-br from-slate-900 to-slate-950 p-4">
          <div className="flex items-center justify-between">
            <span className="h-2 w-20 rounded-full bg-cyan-300/40" />
            <span className="size-2 rounded-full bg-emerald-300" />
          </div>
          <div className="mt-6 grid grid-cols-[0.45fr_1fr] gap-3">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className="block h-2 rounded-full bg-white/6"
                />
              ))}
            </div>
            <div className="rounded-lg border border-white/6 bg-white/3 p-3">
              <span className="block h-2 w-3/4 rounded-full bg-violet-300/20" />
              <span className="mt-3 block h-2 w-full rounded-full bg-white/5" />
              <span className="mt-2 block h-2 w-4/5 rounded-full bg-white/5" />
              <span className="mt-6 block h-8 rounded-md bg-cyan-300/10" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-[27%] rounded-[1.4rem] border border-white/12 bg-slate-950 p-1.5 shadow-2xl">
        <div className="aspect-[9/16] rounded-[1.1rem] bg-linear-to-b from-slate-900 to-slate-950 p-3">
          <span className="mx-auto block h-1 w-8 rounded-full bg-white/10" />
          <div className="mt-5 size-7 rounded-lg bg-cyan-300/12" />
          <span className="mt-4 block h-2 w-full rounded-full bg-white/8" />
          <span className="mt-2 block h-2 w-2/3 rounded-full bg-white/6" />
          <div className="mt-5 space-y-2">
            {[1, 2, 3].map((item) => (
              <span
                key={item}
                className="block h-7 rounded-md border border-white/6 bg-white/3"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
