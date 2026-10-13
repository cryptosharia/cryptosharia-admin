/** User fields that may be serialized into browser page data. */
export interface PublicUserDTO {
	id: string;
	name: string;
	email: string;
	role: string;
	permissions: string[];
}
