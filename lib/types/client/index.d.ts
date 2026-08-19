/**
 * Desk pet plugin, browser half: registers the animated pet into the
 * frame-wide `shell.overlay` slot. Status comes from the browser session
 * snapshot (`useSessions`), so the pet is fully client-side — no host RPC,
 * no network (assets are embedded data URLs).
 * @module @deepseek-ai/dsh-desk-pet/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Services the shell.overlay contribution needs. */
export declare const inject: string[];
/**
 * Register the desk pet into shell.overlay; the layer is click-through and the
 * pet opts back into pointer events through its own inline style.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map