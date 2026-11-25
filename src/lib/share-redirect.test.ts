// @ts-expect-error bun test runtime module
import { expect, it } from 'bun:test';
import { isPreviewCrawler } from '../../supabase/functions/share/preview-crawler';

it('identifies social preview crawlers so they receive Open Graph metadata', () => {
  const crawlers = [
    'WhatsApp/2.23.20.0 A',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Facebot',
    'Twitterbot/1.0',
    'TelegramBot (like TwitterBot)',
    'LinkedInBot/1.0',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  ];
  for (const ua of crawlers) {
    expect(isPreviewCrawler(ua)).toBe(true);
  }
});

it('treats real browsers and in-app webviews as visitors so they redirect straight to the profile page', () => {
  const browsers = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 [FBAN/FBIOS;FBAV/440.0.0.0]',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    '',
    null,
  ];
  for (const ua of browsers) {
    expect(isPreviewCrawler(ua)).toBe(false);
  }
});