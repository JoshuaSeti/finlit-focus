const CRAWLER_UA =
  /\b(whatsapp|facebookexternalhit|facebot|meta-externalagent|twitterbot|telegrambot|linkedinbot|slackbot|slack-imgproxy|discordbot|applebot|googlebot|bingbot|skypeuripreview|viber|pinterestbot|embedly|iframely|vkshare|w3c_validator)\b/i;

/** Return true only for social/link-preview crawlers that read Open Graph tags. */
export function isPreviewCrawler(userAgent: string | null | undefined): boolean {
  return typeof userAgent === "string" && CRAWLER_UA.test(userAgent);
}