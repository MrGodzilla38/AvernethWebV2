// Minecraft head API utility functions

export interface MinecraftHead {
  url: string;
  exists: boolean;
  username: string;
}

// Minecraft head API endpoint (using Crafatar)
const MINECRAFT_HEAD_API = 'https://crafatar.com/avatars/';

// Default Steve head
const STEVE_HEAD_URL = 'https://crafatar.com/avatars/Steve?size=64&default=MHF_Steve';

/**
 * Get Minecraft head URL for a username
 * @param username Minecraft username
 * @returns Promise<MinecraftHead> Head URL and existence info
 */
export async function getMinecraftHead(username: string): Promise<MinecraftHead> {
  try {
    // First check if the username exists by trying to fetch the UUID
    const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    
    if (uuidResponse.ok) {
      const uuidData = await uuidResponse.json();
      if (uuidData && uuidData.id) {
        return {
          url: `${MINECRAFT_HEAD_API}${uuidData.id}?size=64&default=MHF_Steve`,
          exists: true,
          username: username
        };
      }
    }

    // If user doesn't exist, return Steve head
    return {
      url: STEVE_HEAD_URL,
      exists: false,
      username: username
    };
  } catch (error) {
    console.error(`Error fetching Minecraft head for ${username}:`, error);
    return {
      url: STEVE_HEAD_URL,
      exists: false,
      username: username
    };
  }
}

/**
 * Get multiple Minecraft heads for batch processing
 * @param usernames Array of usernames
 * @returns Promise<MinecraftHead[]> Array of head data
 */
export async function getMinecraftHeads(usernames: string[]): Promise<MinecraftHead[]> {
  const promises = usernames.map(username => getMinecraftHead(username));
  return Promise.all(promises);
}

/**
 * Extract Minecraft username from display name
 * @param displayName Full display name (e.g., "John Doe" -> "JohnDoe")
 * @returns Cleaned username for Minecraft API
 */
export function extractMinecraftUsername(displayName: string): string {
  // Remove spaces and special characters, keep only alphanumeric
  return displayName
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Get Minecraft head with fallback for API errors
 * @param username Minecraft username
 * @returns Promise<string> Head URL
 */
export async function getMinecraftHeadWithFallback(username: string): Promise<string> {
  try {
    const head = await getMinecraftHead(username);
    return head.url;
  } catch (error) {
    console.error('Minecraft head API error, using Steve fallback:', error);
    return STEVE_HEAD_URL;
  }
}
