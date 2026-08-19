/**
 * Desk pet component rendered in the `shell.overlay` slot. Reads the active
 * session's running state from the browser session snapshot, animates chibi
 * Kaito Kid actions, plays a completion chime via Web Audio, and supports
 * drag / position memory (localStorage). No network is required: the assets
 * are embedded data URLs.
 * @module @deepseek-ai/dsh-desk-pet/client
 */
import * as React from 'react';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
type DeskPetProps = PropsRuntime<'shell.overlay'>;
/** The animated desk pet at the bottom-right of the frame. */
export declare function DeskPet(props: DeskPetProps): React.ReactElement;
export {};
//# sourceMappingURL=DeskPet.d.ts.map