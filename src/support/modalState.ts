/** Tracks which Ionic-style modal is currently open so the hardware back
 * dispatcher can reproduce the per-modal behavior (§2.5). */
export const modalState: { active?: 'ViewPlanModal' | 'ExitModal' | 'BluetoothModal' } = {};
