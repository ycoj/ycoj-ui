import AccountSettingsPage from './account-settings-page';
import { AVATAR_MAX_BYTES } from './avatar-form-utils';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';
import {
  SETTING_FLAG,
  type AccountSetting,
  type AccountSettingsData,
} from '@/shared/types/account-settings';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  updateAvatar: vi.fn(),
  uploadAvatar: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Account: {
      saveAccountSettings: mocks.save,
      updateAvatar: mocks.updateAvatar,
      uploadAvatar: mocks.uploadAvatar,
    },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock('@/shared/components/markdown-editor', async () => {
  const { forwardRef } = await import('react');
  return {
    default: forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
      function Editor(props, ref) {
        return <textarea {...props} ref={ref} data-testid="markdown-editor" />;
      }
    ),
  };
});

const setting = (
  key: string,
  overrides: Partial<AccountSetting> = {}
): AccountSetting => ({
  key,
  name: key,
  family: 'setting_info',
  type: 'text',
  value: '',
  flag: 0,
  ...overrides,
});
const data: AccountSettingsData = {
  category: 'account',
  current: {
    _id: 2,
    uname: 'alice',
    mail: 'alice@example.com',
    avatar: 'github:alice',
    qq: '12345',
    gender: 0,
    bio: '# Hello',
    school: 'My school',
    phone: '123',
    notes: 'Some notes',
    count: 0,
    enabled: false,
    'plugin.active': true,
  },
  settings: [
    setting('avatar'),
    setting('qq'),
    setting('gender', {
      type: 'select',
      value: 2,
      range: { '0': 'Boy', '1': 'Girl', '2': 'Other' },
    }),
    setting('bio', { type: 'markdown' }),
    setting('school'),
    setting('phone', { flag: SETTING_FLAG.DISABLED }),
    setting('secret', { flag: SETTING_FLAG.SECRET }),
    setting('hidden', { flag: SETTING_FLAG.HIDDEN }),
    setting('storage', { family: 'setting_storage' }),
    setting('notes', {
      type: 'textarea',
      name: 'Plugin notes',
      family: 'Plugin',
      desc: 'Plugin help',
    }),
    setting('count', { type: 'number', value: 99, family: 'Plugin' }),
    setting('enabled', { type: 'boolean', value: true, family: 'Plugin' }),
    setting('plugin.active', { type: 'boolean', family: 'Plugin' }),
    setting('emptyChoice', {
      type: 'select',
      range: [
        ['', 'None'],
        ['x', 'Extra'],
      ],
      family: 'Plugin',
    }),
  ],
};

function pageElement(nextData = data, locale: 'en' | 'zh' = 'en') {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'en' ? en : zh}
    >
      <AccountSettingsPage data={nextData} />
    </NextIntlClientProvider>
  );
}

async function chooseSelect(label: string, option: string) {
  await userEvent.click(page.getByRole('combobox', { name: label }));
  const optionLocator = page.getByRole('option', { name: option });
  await expect.element(optionLocator).toBeVisible();
  await userEvent.click(optionLocator);
}

beforeEach(() => {
  vi.clearAllMocks();
  const success = () => ({
    send: vi.fn().mockResolvedValue({ url: '/home/settings/account' }),
  });
  mocks.save.mockImplementation(success);
  mocks.updateAvatar.mockImplementation(success);
  mocks.uploadAvatar.mockImplementation(success);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('uses the full page width with a separate settings sidebar and flat sections', async () => {
  const { container } = await render(pageElement());

  const shell = container.firstElementChild as HTMLElement;
  expect(shell.getBoundingClientRect().width).toBeGreaterThan(1000);

  const sidebar = page.getByRole('complementary');
  await expect.element(sidebar).toBeVisible();
  const nav = sidebar.getByRole('navigation', { name: 'Settings' });
  const link = nav.getByRole('link', { name: 'Account settings' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('aria-current')).toBe('page');
  expect(link.element().getAttribute('href')).toBe('/home/settings/account');

  const sidebarBounds = sidebar.element().getBoundingClientRect();
  const region = page.getByRole('region', { name: 'Personal information' });
  await expect.element(region).toBeVisible();
  expect(sidebarBounds.left).toBeGreaterThan(
    region.element().getBoundingClientRect().left
  );

  const regionStyle = getComputedStyle(region.element());
  expect(regionStyle.borderLeftWidth).toBe('0px');
  expect(regionStyle.borderTopWidth).toBe('1px');

  const avatarHeading = page.getByRole('heading', { name: 'Avatar' });
  await expect.element(avatarHeading).toBeVisible();
  const avatarSection = avatarHeading.element().closest('section')!;
  expect(getComputedStyle(avatarSection).borderLeftWidth).toBe('0px');
});

test('gives short fields less room than the editor and aligns the actions', async () => {
  await render(pageElement());

  const qqField = page
    .getByLabelText('QQ')
    .element()
    .closest<HTMLElement>('[data-slot="field"]')!;
  const schoolField = page
    .getByLabelText('School')
    .element()
    .closest<HTMLElement>('[data-slot="field"]')!;
  const editorField = page
    .getByTestId('markdown-editor')
    .element()
    .closest<HTMLElement>('[data-slot="field"]')!;

  const qqWidth = qqField.getBoundingClientRect().width;
  const schoolWidth = schoolField.getBoundingClientRect().width;
  const editorWidth = editorField.getBoundingClientRect().width;
  expect(qqWidth).toBeLessThan(schoolWidth);
  expect(schoolWidth).toBeLessThan(editorWidth);

  const editor = page.getByTestId('markdown-editor');
  await expect.element(editor).toBeVisible();
  expect(
    editor.element().getBoundingClientRect().height
  ).toBeGreaterThanOrEqual(200);

  const avatarForm = page.getByRole('form', { name: 'Avatar' });
  await expect.element(avatarForm).toBeVisible();
  expect(getComputedStyle(avatarForm.element()).display).toBe('grid');

  const save = page.getByRole('button', { name: 'Save changes' });
  await expect.element(save).toBeVisible();
  const actions = save.element().parentElement!;
  const shell = document.querySelector('main, [data-slot]')!.closest('div')!;
  expect(actions).not.toBeNull();
  expect(shell).not.toBeNull();
});

test('separates section headings from field labels and aligns actions below the content', async () => {
  await render(pageElement());

  const section = page.getByRole('region', { name: 'Personal information' });
  await expect.element(section).toBeVisible();
  const style = getComputedStyle(section.element());
  expect(style.borderTopWidth).toBe('1px');
  expect(style.display).toBe('grid');

  const heading = section.getByRole('heading', {
    name: 'Personal information',
    level: 2,
  });
  await expect.element(heading).toBeVisible();
  expect(getComputedStyle(heading.element()).fontWeight).toBe('600');

  expect(
    page.getByText('Your contact details, school and introduction.').query()
  ).toBeNull();
  expect(
    page.getByText('Choose an avatar service or upload an image.').query()
  ).toBeNull();
  expect(
    page.getByText('Personalize the appearance of your profile.').query()
  ).toBeNull();

  const save = page.getByRole('button', { name: 'Save changes' });
  const actions = save.element().parentElement!;
  expect(getComputedStyle(actions).justifyContent).toBe('flex-end');
});

test('groups visible fields, initializes each control, and disables protected values', async () => {
  await render(pageElement());

  await expect
    .element(page.getByRole('region', { name: 'Personal information' }))
    .toBeVisible();
  const pluginRegion = page.getByRole('region', { name: 'Plugin' });
  await expect
    .element(pluginRegion.getByLabelText('Plugin notes'))
    .toHaveValue('Some notes');
  await expect.element(page.getByLabelText('hidden')).not.toBeInTheDocument();
  await expect.element(page.getByLabelText('storage')).not.toBeInTheDocument();
  await expect.element(page.getByLabelText('Phone')).toBeDisabled();
  await expect
    .element(page.getByRole('combobox', { name: 'Gender' }))
    .toHaveTextContent('Male');
  await expect
    .element(page.getByTestId('markdown-editor'))
    .toHaveValue('# Hello');
  await expect.element(page.getByLabelText('count')).toHaveValue(0);
  expect(
    page
      .getByRole('checkbox', { name: 'enabled' })
      .element()
      .getAttribute('aria-checked')
  ).toBe('false');
  expect(
    page
      .getByRole('checkbox', { name: 'plugin.active' })
      .element()
      .getAttribute('aria-checked')
  ).toBe('true');
  await expect
    .element(page.getByRole('combobox', { name: 'emptyChoice' }))
    .toHaveTextContent('None');
  await expect.element(page.getByLabelText('secret')).toHaveValue('');
  await expect
    .element(page.getByText('Plugin help', { exact: true }))
    .toBeVisible();
});

test('saves edited fields with true/false, shows success and refreshes in place', async () => {
  await render(pageElement());

  const school = page.getByLabelText('School');
  await userEvent.fill(school, 'New school');
  await userEvent.click(page.getByRole('checkbox', { name: 'enabled' }));
  await userEvent.click(page.getByRole('checkbox', { name: 'plugin.active' }));
  await chooseSelect('Gender', 'Female');
  await userEvent.click(page.getByRole('button', { name: 'Save changes' }));

  await expect.poll(() => mocks.success.mock.calls.length).toBe(1);
  expect(mocks.success).toHaveBeenCalledWith('Account settings saved.');
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({
      school: 'New school',
      gender: '1',
      enabled: true,
      'plugin.active': false,
    })
  );
  expect(mocks.save.mock.calls[0][0]).not.toHaveProperty('avatar');
  expect(mocks.save.mock.calls[0][0]).not.toHaveProperty('phone');
  expect(mocks.save.mock.calls[0][0]).not.toHaveProperty('secret');
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test.each(['backend', 'network'])(
  'preserves edits and displays a %s save failure',
  async (failure) => {
    mocks.save.mockReturnValue({
      send:
        failure === 'backend'
          ? vi.fn().mockResolvedValue({
              error: { name: 'ValidationError', message: 'Invalid school' },
            })
          : vi.fn().mockRejectedValue(new Error('Invalid school')),
    });
    await render(pageElement());

    await userEvent.fill(page.getByLabelText('School'), 'Draft school');
    await userEvent.click(page.getByRole('button', { name: 'Save changes' }));

    await expect.poll(() => mocks.error.mock.calls.length).toBe(1);
    expect(mocks.error).toHaveBeenCalledWith('Invalid school');
    await expect
      .element(page.getByLabelText('School'))
      .toHaveValue('Draft school');
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  }
);

test('retains dirty profile fields across an avatar refresh and updates clean values', async () => {
  const view = await render(pageElement());

  await userEvent.fill(page.getByLabelText('School'), 'Unsaved school');
  await view.rerender(
    pageElement({
      ...data,
      current: { ...data.current, avatar: 'qq:12345', qq: '67890' },
    })
  );

  await expect.element(page.getByLabelText('QQ')).toHaveValue('67890');
  await expect
    .element(page.getByLabelText('School'))
    .toHaveValue('Unsaved school');
});

test('uses Chinese built-in copy while leaving plugin labels intact', async () => {
  await render(pageElement(data, 'zh'));

  await expect
    .element(page.getByRole('heading', { name: '账户设置' }))
    .toBeVisible();
  await expect.element(page.getByLabelText('学校')).toHaveValue('My school');
  await expect
    .element(page.getByLabelText('Plugin notes'))
    .toHaveValue('Some notes');
});

test('switches provider inputs and placeholders and updates provider avatars', async () => {
  await render(pageElement());

  await expect
    .element(page.getByPlaceholder('Enter your GitHub username'))
    .toHaveValue('alice');
  await chooseSelect('Avatar source', 'Gravatar');
  await expect
    .element(page.getByPlaceholder('Email registered with Gravatar'))
    .toHaveAttribute('type', 'email');
  await chooseSelect('Avatar source', 'QQ');
  await userEvent.fill(page.getByPlaceholder('Enter your QQ number'), '12345');
  await userEvent.click(page.getByRole('button', { name: 'Update avatar' }));

  await expect.poll(() => mocks.updateAvatar.mock.calls.length).toBe(1);
  expect(mocks.updateAvatar).toHaveBeenCalledWith('qq', '12345');
  expect(mocks.success).toHaveBeenCalledWith('Avatar updated.');
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test.each(['size', 'extension'])(
  'rejects invalid upload %s without sending',
  async (kind) => {
    await render(pageElement());
    await chooseSelect('Avatar source', 'Upload');

    const input = page.getByLabelText('Avatar image');
    await expect.element(input).toHaveAttribute('accept', '.jpg,.jpeg,.png');
    const file =
      kind === 'size'
        ? new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], 'avatar.png', {
            type: 'image/png',
          })
        : new File(['image'], 'avatar.gif', { type: 'image/png' });
    await userEvent.upload(input, file);
    await userEvent.click(page.getByRole('button', { name: 'Update avatar' }));

    await expect
      .element(
        page.getByText(
          kind === 'size'
            ? 'The image must not exceed 8 MiB.'
            : 'Choose a JPG, JPEG or PNG image.',
          { exact: true }
        )
      )
      .toBeVisible();
    expect(mocks.uploadAvatar).not.toHaveBeenCalled();
  }
);

test('uploads an image, refreshes and releases the temporary preview on unmount', async () => {
  const createUrl = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:avatar-preview');
  const revokeUrl = vi
    .spyOn(URL, 'revokeObjectURL')
    .mockImplementation(() => {});
  const view = await render(pageElement());
  await chooseSelect('Avatar source', 'Upload');

  const file = new File(['image'], 'avatar.PNG', { type: 'image/png' });
  await userEvent.upload(page.getByLabelText('Avatar image'), file);
  await userEvent.click(page.getByRole('button', { name: 'Update avatar' }));

  await expect.poll(() => mocks.success.mock.calls.length).toBe(1);
  expect(mocks.success).toHaveBeenCalledWith('Avatar updated.');
  expect(mocks.uploadAvatar).toHaveBeenCalledWith(file);
  expect(createUrl).toHaveBeenCalledWith(file);
  expect(mocks.refresh).toHaveBeenCalledOnce();

  await view.unmount();
  expect(revokeUrl).toHaveBeenCalledWith('blob:avatar-preview');
});

test('keeps avatar inputs after backend rejection', async () => {
  mocks.updateAvatar.mockReturnValue({
    send: vi.fn().mockResolvedValue({
      error: { name: 'ValidationError', message: 'Invalid avatar' },
    }),
  });
  await render(pageElement());

  await userEvent.click(page.getByRole('button', { name: 'Update avatar' }));

  await expect.poll(() => mocks.error.mock.calls.length).toBe(1);
  expect(mocks.error).toHaveBeenCalledWith('Invalid avatar');
  await expect
    .element(page.getByLabelText('GitHub username'))
    .toHaveValue('alice');
  expect(mocks.refresh).not.toHaveBeenCalled();
});
