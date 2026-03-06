import { localStorageEffect } from '~/utils/recoil-effects';
import { atom } from 'recoil';

export const RECORD_INDEX_PAGE_SIZE_OPTIONS = [30, 60, 120] as const;

export const DEFAULT_RECORD_INDEX_PAGE_SIZE = RECORD_INDEX_PAGE_SIZE_OPTIONS[0];

export const recordIndexPageSizeState = atom<number>({
  key: 'recordIndexPageSizeState',
  default: DEFAULT_RECORD_INDEX_PAGE_SIZE,
  effects: [localStorageEffect()],
});
