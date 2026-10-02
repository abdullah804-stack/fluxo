// remotion/FluxoDemo.tsx
import { AbsoluteFill, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";

const FPS = 30;

// Scene durations in seconds — edit these to match your actual videos
const INTRO_SECONDS = 3;
const S1_SECONDS = 15; // landing page
const S2_SECONDS = 25; // overview 01
const S3_SECONDS = 25; // overview 02
const S4_SECONDS = 35; // overview 03
const OUTRO_SECONDS = 4;

// Crossfade overlap in frames
const FADE_FRAMES = 12;

const INTRO = INTRO_SECONDS * FPS;
const S1 = S1_SECONDS * FPS;
const S2 = S2_SECONDS * FPS;
const S3 = S3_SECONDS * FPS;
const S4 = S4_SECONDS * FPS;
const OUTRO = OUTRO_SECONDS * FPS;

// Total timeline — each scene overlaps the previous by FADE_FRAMES
export const FLUXO_DURATION =
  INTRO + S1 + S2 + S3 + S4 + OUTRO - FADE_FRAMES * 5;

// ------------------------------------------------------------------
// Layout primitives
// ------------------------------------------------------------------

const SceneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0B1220",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Caption: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: 80,
        right: 80,
        opacity,
        color: "#ffffff",
        fontSize: 26,
        fontWeight: 500,
        textAlign: "center",
        textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        letterSpacing: "-0.01em",
      }}
    >
      {text}
    </div>
  );
};

// Handles fading in AND out so the transition never blinks
const Scene: React.FC<{
  durationInFrames: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({ durationInFrames, fadeIn = true, fadeOut = true, children }) => {
  const frame = useCurrentFrame();

  const fadeInOpacity = fadeIn
    ? interpolate(frame, [0, FADE_FRAMES], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  const fadeOutOpacity = fadeOut
    ? interpolate(
        frame,
        [durationInFrames - FADE_FRAMES, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp" }
      )
    : 1;

  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#0B1220" }}>
      {children}
    </AbsoluteFill>
  );
};

const ScreenFrame: React.FC<{ src: string; durationInFrames: number }> = ({
  src,
}) => {
  return (
    <div
      style={{
        width: 1600,
        height: 900,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow:
          "0 40px 120px -20px rgba(59, 107, 255, 0.35), 0 8px 32px rgba(0,0,0,0.5)",
        border: "1px solid rgba(59, 107, 255, 0.18)",
      }}
    >
      <Video
  src={staticFile(src)}
  style={{ width: "100%", height: "100%", objectFit: "cover" }}
  muted
/>
    </div>
  );
};

// ------------------------------------------------------------------
// Intro and Outro
// ------------------------------------------------------------------

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15, INTRO - 15, INTRO], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(
    frame,
    [15, 30, INTRO - 15, INTRO],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B1220",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,107,255,0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            margin: "0 auto 32px",
            background:
              "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 0 50px rgba(59,107,255,0.6)",
          }}
        >
          F
        </div>
        <h1
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.04em",
            opacity: titleOpacity,
            margin: 0,
            lineHeight: 1,
          }}
        >
          Fluxo
        </h1>
        <p
          style={{
            fontSize: 30,
            color: "#8B95AB",
            marginTop: 24,
            opacity: subtitleOpacity,
            letterSpacing: "-0.01em",
          }}
        >
          Your WhatsApp, running your business.
        </p>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B1220",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,107,255,0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div style={{ textAlign: "center", position: "relative" }}>
        <h2
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.04em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Fluxo
        </h2>
        <p
          style={{
            fontSize: 26,
            color: "#8B95AB",
            marginTop: 20,
          }}
        >
          The WhatsApp Business OS
        </p>
        <p
          style={{
            fontSize: 22,
            color: "#6B8AFF",
            marginTop: 48,
            fontFamily: "monospace",
          }}
        >
          github.com/abdullah804-stack/fluxo
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// Main composition
// ------------------------------------------------------------------

export const FluxoDemo: React.FC = () => {
  // Each scene starts FADE_FRAMES before the previous one ends,
  // creating a seamless crossfade with no black gap.
  const introFrom = 0;
  const s1From = introFrom + INTRO - FADE_FRAMES;
  const s2From = s1From + S1 - FADE_FRAMES;
  const s3From = s2From + S2 - FADE_FRAMES;
  const s4From = s3From + S3 - FADE_FRAMES;
  const outroFrom = s4From + S4 - FADE_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1220" }}>
      <Sequence from={introFrom} durationInFrames={INTRO}>
        <Scene durationInFrames={INTRO} fadeIn={false} fadeOut>
          <Intro />
        </Scene>
      </Sequence>

      <Sequence from={s1From} durationInFrames={S1}>
        <Scene durationInFrames={S1}>
          <SceneShell>
            <ScreenFrame
              src="demo/fluxo-landingpage.mp4"
              durationInFrames={S1}
            />
            <Caption
              text="Turn WhatsApp into a business"
              durationInFrames={S1}
            />
          </SceneShell>
        </Scene>
      </Sequence>

      <Sequence from={s2From} durationInFrames={S2}>
        <Scene durationInFrames={S2}>
          <SceneShell>
            <ScreenFrame
              src="demo/fluxo-overview-01.mp4"
              durationInFrames={S2}
            />
            <Caption
              text="Every message, structured automatically"
              durationInFrames={S2}
            />
          </SceneShell>
        </Scene>
      </Sequence>

      <Sequence from={s3From} durationInFrames={S3}>
        <Scene durationInFrames={S3}>
          <SceneShell>
            <ScreenFrame
              src="demo/fluxo-overview-02.mp4"
              durationInFrames={S3}
            />
            <Caption
              text="Orders, customers, and payments tracked"
              durationInFrames={S3}
            />
          </SceneShell>
        </Scene>
      </Sequence>

      <Sequence from={s4From} durationInFrames={S4}>
        <Scene durationInFrames={S4}>
          <SceneShell>
            <ScreenFrame
              src="demo/fluxo-overview-03.mp4"
              durationInFrames={S4}
            />
            <Caption
              text="Run the business with WhatsApp commands"
              durationInFrames={S4}
            />
          </SceneShell>
        </Scene>
      </Sequence>

      <Sequence from={outroFrom} durationInFrames={OUTRO}>
        <Scene durationInFrames={OUTRO} fadeIn fadeOut={false}>
          <Outro />
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};