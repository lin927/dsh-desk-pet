/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-desk-pet`.
 * @module @deepseek-ai/dsh-desk-pet/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-desk-pet'

/** Cordis companion plugin name. */
export const name = 'desk-pet-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the pet holds all its mutable state (current action,
 * position) in browser component memory, with no cross-plugin state and no
 * authoritative host event stream it observes. Registration/disposal of the
 * `shell.overlay` contribution is asserted by the client slot lifecycle.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
