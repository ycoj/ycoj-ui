import {
  ObjectiveDropdown,
  ObjectiveInput,
  ObjectiveMultiselect,
  ObjectiveOption,
  ObjectiveSelect,
  ObjectiveTextarea,
} from '@/features/problem/objective/controls';
import type { Components } from 'react-markdown';
import type { Options as Schema } from 'rehype-sanitize';

export const objectiveExtraTagNames = [
  'objective-input',
  'objective-textarea',
  'objective-dropdown',
  'objective-select',
  'objective-multiselect',
  'objective-option',
] as const;

export const objectiveComponents = {
  'objective-input': ObjectiveInput,
  'objective-textarea': ObjectiveTextarea,
  'objective-dropdown': ObjectiveDropdown,
  'objective-select': ObjectiveSelect,
  'objective-multiselect': ObjectiveMultiselect,
  'objective-option': ObjectiveOption,
} as unknown as Components;

const objectiveIdAttributes: NonNullable<Schema['attributes']>[string] = [
  ['data-id', /^\d+(-\d+)?$/],
  ['dataId', /^\d+(-\d+)?$/],
];

export const objectiveExtraAttributes: NonNullable<Schema['attributes']> =
  (() => {
    const attrs: NonNullable<Schema['attributes']> = {};
    for (const tag of objectiveExtraTagNames) {
      if (tag === 'objective-option') {
        attrs[tag] = [
          ['data-value', /^.+$/],
          ['dataValue', /^.+$/],
        ];
      } else if (tag === 'objective-dropdown') {
        attrs[tag] = [...objectiveIdAttributes, 'data-options', 'dataOptions'];
      } else {
        attrs[tag] = [...objectiveIdAttributes];
      }
    }
    return attrs;
  })();

export function makeObjectiveSchema(base: Schema): Schema {
  return {
    ...base,
    tagNames: [...(base.tagNames ?? []), ...objectiveExtraTagNames],
    attributes: {
      ...base.attributes,
      ...objectiveExtraAttributes,
    },
  };
}
