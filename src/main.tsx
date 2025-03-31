import p5 from "p5";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createSketch as createWaterSketch, numericParameterDefs as waterNumericParameterDefs, initParameterStore as initWaterParameterStore } from "./water";

type SketchType = "default" | "crimson";

// Add this type definition before your sketchConfigs object
type ParameterDefinition = {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

// Update your sketch configuration type
type SketchConfig = {
  name: string;
  title: string;
  createSketch: Function;
  parameterDefs: Record<string, ParameterDefinition>;
  initStore: () => any;
};

// Create a map of sketch configurations
const sketchConfigs: Record<string, SketchConfig> = {
  default: {
    name: "Water Sketch",
    title: "this is a water sketch",
    createSketch: createWaterSketch,
    parameterDefs: waterNumericParameterDefs,
    initStore: initWaterParameterStore
  }
};

// Create initial parameter store
let parameterStore = initWaterParameterStore();
let p5Instance: p5;

// Entrypoint code
function main(rootElement: HTMLElement) {
  // Create a p5 instance in instance mode
  p5Instance = new p5(createWaterSketch(parameterStore), rootElement);
}

// Split the React component into two parts: Title and Controls
function TitleComponent() {
  const [sketchType, setSketchType] = useState<SketchType>("default");

  // Get the current title from the sketchConfig
  const currentTitle = sketchConfigs[sketchType].title;

  // Update the document title when the sketch changes
  useEffect(() => {
    document.title = currentTitle;
  }, [currentTitle]);

  useEffect(() => {
    const config = sketchConfigs[sketchType];

    const newParams = config.initStore();

    parameterStore = newParams;

    if (p5Instance) {
      p5Instance.remove();
    }

    p5Instance = new p5(config.createSketch(parameterStore), rootEl!);

    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [sketchType]);

  return (
    <div className="title-container">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
        {currentTitle}
      </h1>
      <h3 className="text-sm font-medium text-center mb-8 text-gray-600">
        click to capture fish
      </h3>
    </div>
  );
}

function TestApp() {
  const [showParams, setShowParams] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true';
  });

  // Get current sketch type from global state
  const [numericParameters, setNumericParameters] = useState(initWaterParameterStore());

  useEffect(() => {
    const url = new URL(window.location.href);
    if (showParams) {
      url.searchParams.set('debug', 'true');
    } else {
      url.searchParams.delete('debug');
    }
    window.history.replaceState({}, '', url);
  }, [showParams]);

  if (!showParams) {
    return null;
  }

  // Determine which sketch is currently active - fixed to avoid TypeScript error
  const currentSketchType = Object.keys(sketchConfigs).find(key => {
    // Instead of checking _setupDone, check if p5Instance exists
    return p5Instance != null;
  }) as SketchType || "default";

  const currentParameterDefs = sketchConfigs[currentSketchType].parameterDefs;

  return (
    <>

      <div className="controls-panel">

        <h2 className="text-xl font-bold mb-6 text-gray-700">Parameters</h2>
        {Object.entries(currentParameterDefs).map(([key, value]) => (
          <div key={key} className="mb-4 flex items-center gap-4">
            <label className="w-32 font-medium text-gray-700">{key}</label>
            <input
              type="range"
              min={value.min}
              max={value.max}
              step={value.step}
              value={numericParameters[key as keyof typeof numericParameters]}
              className="flex-grow"
              onChange={(e) => {
                console.log(e.target.value, typeof e.target.value);
                const newValue = parseFloat(e.target.value);
                setNumericParameters({...numericParameters, [key]: newValue});
                parameterStore[key as keyof typeof parameterStore] = newValue;
              }}
            />
            <span className="w-16 text-right text-gray-600">
              {numericParameters[key as keyof typeof numericParameters]}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// Render the title component to the title-root div
const titleContainer = document.getElementById("title-root");
if (titleContainer) {
  const titleRoot = createRoot(titleContainer);
  titleRoot.render(<TitleComponent />);
}

// Render the controls to the original react-root div
const container = document.getElementById("react-root");
if (!container) {
  throw new Error("Cannot find element root #react-root");
}
const root = createRoot(container);
root.render(<TestApp />);

// Initialize the P5 instance
const rootEl = document.getElementById("p5-root");
if (!rootEl) {
  throw new Error("Cannot find element root #p5-root");
}
main(rootEl);
