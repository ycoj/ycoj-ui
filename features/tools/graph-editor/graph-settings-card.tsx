'use client';

import { MAX_NODE_COUNT } from './graph-parse';
import type { ColorOverrides, EditorMode, IndexScheme } from './graph-types';
import type { GraphEditorController } from './use-graph-editor';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Download,
  FileCode,
  GitFork,
  Hand,
  MousePointer,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const MODES: { value: EditorMode; icon: LucideIcon }[] = [
  { value: 'force', icon: Hand },
  { value: 'draw', icon: MousePointer },
  { value: 'edit', icon: Pencil },
  { value: 'delete', icon: Trash2 },
];

const SCHEMES: IndexScheme[] = ['zero', 'one', 'custom'];

const COLOR_FIELDS: (keyof ColorOverrides)[] = ['node', 'label', 'edge'];

type Props = {
  editor: GraphEditorController;
};

export default function GraphSettingsCard({ editor }: Props) {
  const t = useTranslations('graphEditor');
  const {
    scheme,
    directed,
    mode,
    style,
    colors,
    nodeCount,
    onSchemeChange,
    onDirectedChange,
    onModeChange,
    onStyleChange,
    onNodeCountChange,
    onFixAll,
    onUnfixAll,
    onTreeLayout,
    onExportPng,
    onExportSvg,
  } = editor;

  // Local draft lets the field be cleared or hold partial input; only
  // valid digit strings commit, and blur reverts to the actual count.
  const [nodeCountDraft, setNodeCountDraft] = useState<string | null>(null);

  const setColor = (key: keyof ColorOverrides, value: string) => {
    onStyleChange({
      ...style,
      colors: { ...style.colors, [key]: value },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settingsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-1 rounded-lg border p-1">
          {MODES.map(({ value, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={mode === value ? 'default' : 'ghost'}
              className="h-auto flex-col gap-0.5 py-1.5"
              onClick={() => onModeChange(value)}
              aria-pressed={mode === value}
            >
              <Icon className="size-4" />
              <span className="text-[10px] leading-none">
                {t(`mode.${value}`)}
              </span>
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">{t(`modeHint.${mode}`)}</p>

        <div className="flex items-center gap-2">
          <Checkbox
            id="graph-directed"
            checked={directed}
            onCheckedChange={(checked) => onDirectedChange(checked === true)}
          />
          <Label htmlFor="graph-directed">{t('directed')}</Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="graph-scheme">{t('indexing')}</Label>
            <Select
              value={scheme}
              onValueChange={(value) => onSchemeChange(value as IndexScheme)}
            >
              <SelectTrigger id="graph-scheme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEMES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`scheme.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {scheme !== 'custom' && (
            <div className="space-y-1.5">
              <Label htmlFor="graph-node-count">{t('nodeCount')}</Label>
              <Input
                id="graph-node-count"
                type="number"
                min={0}
                max={MAX_NODE_COUNT}
                value={nodeCountDraft ?? String(nodeCount)}
                onChange={(event) => {
                  const draft = event.target.value;
                  setNodeCountDraft(draft);
                  if (/^\d+$/.test(draft)) onNodeCountChange(Number(draft));
                }}
                onBlur={() => setNodeCountDraft(null)}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="graph-radius">{t('nodeRadius')}</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {style.nodeRadius}
              </span>
            </div>
            <input
              id="graph-radius"
              type="range"
              min={10}
              max={40}
              step={1}
              value={style.nodeRadius}
              onChange={(event) =>
                onStyleChange({
                  ...style,
                  nodeRadius: Number(event.target.value),
                })
              }
              className="accent-primary w-full"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="graph-edge-length">{t('edgeLength')}</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {style.edgeLength}
              </span>
            </div>
            <input
              id="graph-edge-length"
              type="range"
              min={40}
              max={260}
              step={5}
              value={style.edgeLength}
              onChange={(event) =>
                onStyleChange({
                  ...style,
                  edgeLength: Number(event.target.value),
                })
              }
              className="accent-primary w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {COLOR_FIELDS.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`graph-color-${key}`}>{t(`color.${key}`)}</Label>
              <input
                id={`graph-color-${key}`}
                type="color"
                value={colors[key]}
                onChange={(event) => setColor(key, event.target.value)}
                className="border-input bg-background h-8 w-full cursor-pointer rounded-md border p-0.5"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onFixAll}>
            <Pin className="size-4" />
            {t('fixAll')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUnfixAll}
          >
            <PinOff className="size-4" />
            {t('unfixAll')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTreeLayout}
          >
            <GitFork className="size-4" />
            {t('treeLayout')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" size="sm" onClick={onExportPng}>
            <Download className="size-4" />
            {t('exportPng')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportSvg}
          >
            <FileCode className="size-4" />
            {t('exportSvg')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
