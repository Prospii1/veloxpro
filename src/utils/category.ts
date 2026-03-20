/**
 * Normalizes category names from the supplier API to a standard set.
 */
export const normalizeCategory = (category: string): string => {
  const c = category.toLowerCase().trim();
  
  // Facebook
  if (c === 'fb' || c === 'facebook' || c.includes('facebook')) return 'Facebook';
  
  // Instagram
  if (c === 'insta' || c === 'instagram' || c === 'ig' || c.includes('instagram')) return 'Instagram';
  
  // Twitter / X
  if (c === 'twitter' || c === 'x' || c.includes('twitter')) return 'Twitter';
  
  // TikTok
  if (c === 'tiktok' || c === 'tik tok' || c.includes('tiktok')) return 'TikTok';
  
  // YouTube
  if (c === 'youtube' || c === 'yt' || c.includes('youtube')) return 'YouTube';
  
  // Telegram
  if (c === 'telegram' || c === 'tg' || c.includes('telegram')) return 'Telegram';
  
  // LinkedIn
  if (c === 'linkedin' || c.includes('linkedin')) return 'LinkedIn';

  // Discord
  if (c === 'discord' || c.includes('discord')) return 'Discord';

  // Spotify
  if (c === 'spotify' || c.includes('spotify')) return 'Spotify';

  // If no match, capitalize properly
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};
