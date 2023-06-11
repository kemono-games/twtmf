import { ResourceType } from 'puppeteer'

export const ABORT_RESOURCE_TYPES: ResourceType[] = ['image', 'media', 'font']
export const ABORT_SCRIPT_URL_KEYWORDS = [
  'shared~loader.video',
  'EmojiPicker',
  'emoji',
  'bundle.NetworkInstrument',
  'loader.PushNotificationsPrompt',
  'google',
]
export const ABORT_XHR_URL_KEYWORDS = [
  'events',
  'client_event.json',
  'log.json',
  'init.json',
  '/keyregistry/register',
  'getAltTextPromptPreference',
  'hashflags.json',
  'settings.json',
  'AudioSpaceById',
]
