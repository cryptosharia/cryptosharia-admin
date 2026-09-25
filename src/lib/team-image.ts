const PUBLIC_SITE_ORIGIN = 'https://www.cryptosharia.id';

/**
 * Team seed data uses paths served by the public website. Resolve those paths
 * before rendering them from the separate admin origin.
 */
export function resolveTeamImageUrl(imageUrl: string | null | undefined): string {
	if (!imageUrl) return '';
	if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
	return `${PUBLIC_SITE_ORIGIN}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
}
