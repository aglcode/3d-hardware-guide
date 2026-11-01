import { Composition } from 'remotion'
import { INTRO_FPS, INTRO_FRAMES, INTRO_HEIGHT, INTRO_WIDTH } from '../data/intro-script.ts'
import { IntroVideo } from './IntroVideo.tsx'

export function Root() {
  return <Composition id="CircuitLabIntro" component={IntroVideo} durationInFrames={INTRO_FRAMES} fps={INTRO_FPS} width={INTRO_WIDTH} height={INTRO_HEIGHT} />
}
