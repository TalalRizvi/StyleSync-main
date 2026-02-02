import React from 'react';
import SliderHandleIcon from './icons/SliderHandleIcon';

interface CompareProps {
  firstImage: string;
  secondImage: string;
  className?: string;
}

const Compare: React.FC<CompareProps> = ({
  firstImage,
  secondImage,
  className = '',
}) => {
  const [sliderXPercent, setSliderXPercent] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let x = clientX - rect.left;
      if (x < 0) x = 0;
      if (x > rect.width) x = rect.width;
      const percent = (x / rect.width) * 100;
      setSliderXPercent(percent);
    },
    []
  );

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );
  
  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
        if (!isDragging) return;
        handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleTouchEnd = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onTouchStart = () => setIsDragging(true);

  return (
    <div
      ref={containerRef}
      className={`relative select-none w-full aspect-[3/4] overflow-hidden rounded-lg shadow-lg cursor-ew-resize ${className}`}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Second Image (Bottom Layer) */}
      <img
        src={secondImage}
        alt="AI-generated model"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      {/* First Image (Top Layer, clipped) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{
          clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
        }}
      >
        <img
          src={firstImage}
          alt="Original user upload"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Slider Line and Handle */}
      <div
        className="absolute inset-y-0 w-1 bg-white/70 backdrop-blur-sm pointer-events-none"
        style={{ left: `${sliderXPercent}%`, transform: 'translateX(-50%)' }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12"
        >
          <SliderHandleIcon />
        </div>
      </div>
    </div>
  );
};

export default Compare;