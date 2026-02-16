import { AppShell } from "@/components/layout/AppShell";
import { LibraryView } from "@/components/library/LibraryView";
import { CommandPalette } from "@/components/command/CommandPalette";

export default function Home() {
  return (
    <AppShell>
      <LibraryView />
      <CommandPalette />
    </AppShell>
  );
}
