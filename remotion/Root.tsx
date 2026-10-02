// remotion/Root.tsx
import React from "react";
import { Composition } from "remotion";
import { FluxoDemo, FLUXO_DURATION } from "./FluxoDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FluxoDemo"
      component={FluxoDemo}
      durationInFrames={FLUXO_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};