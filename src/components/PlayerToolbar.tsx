"use client";

import { StopAllButton } from "./StopAllButton";
import { StopOthersToggle } from "./StopOthersToggle";
import { VolumeControl } from "./VolumeControl";

/**
 * Toolbar kontrol pemutar suara: volume master, mute, opsi stop-others,
 * dan tombol Stop All.
 */
export function PlayerToolbar() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-40 flex-1">
        <VolumeControl />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <StopOthersToggle />
        <StopAllButton />
      </div>
    </div>
  );
}
