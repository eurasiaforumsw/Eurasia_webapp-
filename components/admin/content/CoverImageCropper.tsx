'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

type Point = { x: number; y: number };
type Area = { width: number; height: number; x: number; y: number };

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface CoverImageCropperProps {
  imageUrl: string;
  initialCrop?: CropData;
  onSave: (cropData: CropData, croppedAreaPixels: Area) => void;
  onCancel?: () => void;
}

const ASPECT_RATIOS = [
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: 'Free', value: undefined },
];

export default function CoverImageCropper({
  imageUrl,
  initialCrop,
  onSave,
  onCancel,
}: CoverImageCropperProps) {
  const [crop, setCrop] = useState<Point>(
    initialCrop ? { x: initialCrop.x, y: initialCrop.y } : { x: 0, y: 0 }
  );
  const [zoom, setZoom] = useState(initialCrop?.scale || 1);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rotation, setRotation] = useState(0);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = () => {
    if (!croppedAreaPixels) return;

    const cropData: CropData = {
      x: crop.x,
      y: crop.y,
      width: croppedAreaPixels.width,
      height: croppedAreaPixels.height,
      scale: zoom,
    };

    onSave(cropData, croppedAreaPixels);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectRatio(16 / 9);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl mx-4 bg-[#0A0D12] rounded-3xl border border-[#1E2636] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#1E2636]">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Crop Cover Image
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Adjust the crop area, zoom, and aspect ratio for your cover image
          </p>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[500px] bg-[#05070C]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                backgroundColor: '#05070C',
              },
              cropAreaStyle: {
                border: '2px solid #38BDF8',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-8 py-6 bg-[#0F131C] border-t border-[#1E2636] space-y-6">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Zoom</label>
              <span className="text-sm text-gray-400 font-mono">{zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#161D2B] rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#38BDF8]
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-[#38BDF8]/50 [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#38BDF8] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:shadow-[#38BDF8]/50"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Rotation</label>
              <span className="text-sm text-gray-400 font-mono">{rotation}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full h-2 bg-[#161D2B] rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#38BDF8]
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-[#38BDF8]/50 [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#38BDF8] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:shadow-[#38BDF8]/50"
            />
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-3">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                    ${
                      aspectRatio === ratio.value
                        ? 'bg-[#38BDF8] text-white shadow-lg shadow-[#38BDF8]/30'
                        : 'bg-[#161D2B] text-gray-400 hover:bg-[#1E2636] hover:text-gray-300'
                    }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Info */}
          {croppedAreaPixels && (
            <div className="p-4 bg-[#161D2B] rounded-xl">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Crop Preview Info</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-mono">
                <div className="text-gray-400">
                  Width: <span className="text-[#38BDF8]">{Math.round(croppedAreaPixels.width)}px</span>
                </div>
                <div className="text-gray-400">
                  Height: <span className="text-[#38BDF8]">{Math.round(croppedAreaPixels.height)}px</span>
                </div>
                <div className="text-gray-400">
                  X: <span className="text-[#38BDF8]">{Math.round(croppedAreaPixels.x)}px</span>
                </div>
                <div className="text-gray-400">
                  Y: <span className="text-[#38BDF8]">{Math.round(croppedAreaPixels.y)}px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-[#0A0D12] border-t border-[#1E2636] flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-400 bg-[#161D2B]
              hover:bg-[#1E2636] hover:text-gray-300 transition-all duration-200"
          >
            Reset
          </button>

          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-400 bg-[#161D2B]
                  hover:bg-[#1E2636] hover:text-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!croppedAreaPixels}
              className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-[#38BDF8]
                hover:bg-[#38BDF8]/90 shadow-lg shadow-[#38BDF8]/30 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
