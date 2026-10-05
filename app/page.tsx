"use client";

import HeroGroup from "../components/HeroGroup";
import InsideJokes from "../components/InsideJokes";
import Distance from "../components/Distance";
import Duality from "../components/Duality";
import EmotionalReset from "../components/EmotionalReset";
import Constellation from "../components/Constellation";
import BackgroundAudio from "../components/BackgroundAudio"; // <--- Import it
import Ending from "../components/Ending";

export default function MasterVault() {
  return (
    <main className="relative bg-[#050505] text-white selection:bg-[#F472B6]/30 selection:text-[#F472B6] overflow-x-hidden font-sans">
      
      {/* Global Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#9333EA]/5 via-[#050505] to-[#050505]"></div>

      <BackgroundAudio /> {/* <--- Drop it here */}

      {/* The Assembled Masterpiece */}
      <HeroGroup />
      <InsideJokes />
      <Distance />
      <Duality />
      <EmotionalReset />
      <Constellation />
      <Ending />

    </main>
  );
}