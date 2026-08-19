/**
 * Desk pet plugin, browser half: registers the animated pet into the
 * frame-wide `shell.overlay` slot. Status comes from the browser session
 * snapshot (`useSessions`), so the pet is fully client-side — no host RPC,
 * no network (assets are embedded data URLs).
 * @module @deepseek-ai/dsh-desk-pet/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-layout SlotMap merge declaring the shell.overlay seat.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { DeskPet } from './DeskPet.tsx'

/** Services the shell.overlay contribution needs. */
export const inject = ['slots']

/**
 * Register the desk pet into shell.overlay; the layer is click-through and the
 * pet opts back into pointer events through its own inline style.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'desk-pet', order: 300, label: '桌宠' },
    DeskPet,
  ))
}
