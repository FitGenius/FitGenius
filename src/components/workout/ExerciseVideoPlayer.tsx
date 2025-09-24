'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, RotateCcw, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ExerciseVideo {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  category?: string;
  muscleGroups?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  tips?: string[];
}

interface ExerciseVideoPlayerProps {
  video?: ExerciseVideo;
  videos?: ExerciseVideo[];
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  onVideoEnd?: () => void;
  className?: string;
}

export function ExerciseVideoPlayer({
  video,
  videos = [],
  autoPlay = false,
  loop = false,
  showControls = true,
  onVideoEnd,
  className
}: ExerciseVideoPlayerProps) {
  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referências
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayTimeoutRef = useRef<NodeJS.Timeout>();

  // Lista de vídeos (se múltiplos)
  const videoList = video ? [video] : videos;
  const currentVideo = videoList[currentVideoIndex];

  // Controles de reprodução
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipToNext = () => {
    if (currentVideoIndex < videoList.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (loop) {
      setCurrentVideoIndex(0);
    }
  };

  const skipToPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else if (loop) {
      setCurrentVideoIndex(videoList.length - 1);
    }
  };

  const restart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeVolume = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const seekTo = (value: number[]) => {
    const time = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (error) {
        console.error('Erro ao entrar em tela cheia:', error);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (error) {
        console.error('Erro ao sair da tela cheia:', error);
      }
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];

    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Eventos do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) onVideoEnd();

      if (videoList.length > 1) {
        skipToNext();
      } else if (loop) {
        video.play();
        setIsPlaying(true);
      }
    };

    const handleError = () => {
      setError('Erro ao carregar o vídeo');
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentVideoIndex, loop, onVideoEnd, videoList]);

  // Auto-ocultar overlay
  useEffect(() => {
    if (showOverlay) {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
      overlayTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowOverlay(false);
        }
      }, 3000);
    }

    return () => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, [showOverlay, isPlaying]);

  // Fallback se não houver vídeo
  if (!currentVideo) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Video className="w-16 h-16 mb-4 opacity-30" />
            <p>Nenhum vídeo disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header com informações do exercício */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-gold" />
          {currentVideo.name}
        </CardTitle>
        {currentVideo.category && (
          <CardDescription>
            {currentVideo.category}
            {currentVideo.difficulty && ` • ${currentVideo.difficulty}`}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Container do vídeo */}
        <div
          ref={containerRef}
          className="relative bg-black aspect-video cursor-pointer group"
          onMouseMove={() => setShowOverlay(true)}
          onClick={togglePlay}
        >
          {/* Vídeo */}
          <video
            ref={videoRef}
            src={currentVideo.url}
            poster={currentVideo.thumbnailUrl}
            className="w-full h-full object-contain"
            autoPlay={autoPlay}
            loop={loop && videoList.length === 1}
            muted={isMuted}
          />

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-red-500 text-center">
                <p>{error}</p>
                <Button onClick={restart} size="sm" className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {/* Overlay de controles */}
          <AnimatePresence>
            {showControls && showOverlay && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botão play central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    onClick={togglePlay}
                    size="lg"
                    variant="ghost"
                    className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  >
                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
                  </Button>
                </div>

                {/* Controles inferiores */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  {/* Barra de progresso */}
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={1}
                    onValueChange={seekTo}
                    className="cursor-pointer"
                  />

                  {/* Botões e tempo */}
                  <div className="flex items-center justify-between text-white text-sm">
                    <div className="flex items-center gap-2">
                      {/* Play/Pause */}
                      <Button
                        onClick={togglePlay}
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>

                      {/* Skip (se múltiplos vídeos) */}
                      {videoList.length > 1 && (
                        <>
                          <Button
                            onClick={skipToPrevious}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                          >
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={skipToNext}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                          >
                            <SkipForward className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Restart */}
                      <Button
                        onClick={restart}
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>

                      {/* Volume */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={toggleMute}
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <div className="w-20">
                          <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.1}
                            onValueChange={changeVolume}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Tempo */}
                      <span className="ml-2">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Velocidade */}
                      <Button
                        onClick={changePlaybackRate}
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 min-w-[50px]"
                      >
                        {playbackRate}x
                      </Button>

                      {/* Tela cheia */}
                      <Button
                        onClick={toggleFullscreen}
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de vídeos (se múltiplos) */}
                {videoList.length > 1 && (
                  <div className="absolute top-4 right-4 text-white bg-black/50 px-3 py-1 rounded">
                    {currentVideoIndex + 1} / {videoList.length}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instruções e dicas */}
        {(currentVideo.instructions || currentVideo.tips || currentVideo.muscleGroups) && (
          <div className="p-4 space-y-4">
            {currentVideo.muscleGroups && (
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Músculos Trabalhados</h4>
                <div className="flex flex-wrap gap-2">
                  {currentVideo.muscleGroups.map((muscle, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gold/10 text-gold text-xs rounded"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentVideo.instructions && (
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Instruções</h4>
                <ol className="space-y-1">
                  {currentVideo.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {index + 1}. {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {currentVideo.tips && (
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">Dicas</h4>
                <ul className="space-y-1">
                  {currentVideo.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}