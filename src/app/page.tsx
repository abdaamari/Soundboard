import { PlayerToolbar } from "@/components/PlayerToolbar";
import { Soundboard } from "@/components/Soundboard";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";

export default function Home() {
  return (
    <AudioPlayerProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">
            Meme Soundboard Tim 🔊
          </h1>
          <p className="text-sm text-zinc-400 sm:text-base">
            Koleksi efek suara lucu khas internal tim. Klik tombolnya, rasakan
            energinya. 🎉
          </p>
        </header>

        <div className="mt-6">
          <PlayerToolbar />
        </div>

        <main className="mt-8 flex flex-1 flex-col">
          <Soundboard />
        </main>

        <footer className="mt-12 border-t border-white/10 pt-4 text-center text-xs text-zinc-500">
          Dibuat dengan ❤️ oleh tim — semua suara disimpan lokal di browser
          kamu.
        </footer>
      </div>
    </AudioPlayerProvider>
  );
}
