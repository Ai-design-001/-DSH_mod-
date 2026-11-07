/**
 * Host half of the dsh-plugin-session-delete-and-appearance bundle.
 *
 * The plugin is browser-side only: the Client module (client.js) registers the
 * session-row delete surfaces and the "appearance" settings section. The Host
 * half exists because a dsh bundle needs an installable entry; it registers no
 * services, opens no files and makes no network requests.
 */
export function apply() {}
