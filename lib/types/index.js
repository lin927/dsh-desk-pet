/**
 * Desk pet plugin, node half.
 *
 * This is a client-only UI plugin: the pet reads the active session's running
 * state from the browser-side session snapshot (`useSessions` in the
 * `shell.overlay` slot) and renders animated chibi assets embedded in the
 * client bundle. The node half is intentionally a no-op plugin so the
 * `dsh.client` package resolves as a loader row; all behavior lives in the
 * browser half (`./client`).
 * @module @deepseek-ai/dsh-desk-pet
 */
/** No-op node-half plugin: the browser half owns the whole pet. */
export const name = 'desk-pet';
/** @param ctx - cordis context (unused; the pet is browser-side). */
export function apply(_ctx) {
    // Intentionally empty — see the module doc.
}
//# sourceMappingURL=index.js.map