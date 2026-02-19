'server-only';

import { getHomepage } from './homepage';
import { getAvailableLanguages } from './languages';
import { getMedia } from './media';
import { getNavInfos } from './nav';

const UI = {
  getNavInfos,
  getHomepage,
  getAvailableLanguages,
  getMedia,
};

export default UI;
