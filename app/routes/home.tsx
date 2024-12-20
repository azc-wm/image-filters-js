import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect, useRef, type ChangeEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

interface ImgCellRenderer {
  x: number;
  y: number;
  threshold: number;
  color: string;
  readonly ctx: CanvasRenderingContext2D;
  draw(): void;
}

class SobelCellRenderer implements ImgCellRenderer {
  x: number;
  y: number;
  threshold: number;
  color: string;
  ctx: CanvasRenderingContext2D;
  magnitude: number;
  angle: number;
  maxMagnitude: MaxMagnitude;

  constructor(
    x: number,
    y: number,
    threshold: number,
    color: string,
    magnitude: number,
    angle: number,
    maxMagnitude: MaxMagnitude,
    ctx: CanvasRenderingContext2D
  ) {
    this.x = x;
    this.y = y;
    this.threshold = threshold;
    this.color = color;
    this.magnitude = magnitude;
    this.angle = angle;
    this.maxMagnitude = maxMagnitude;
    this.ctx = ctx;
  }

  draw() {
    //this.ctx.fillStyle = this.color;

    /*   if (this.x % 100 == 0 && this.y % 100 == 0)
        console.log({
          x: this.x,
          y: this.y,
          magnitude: this.magnitude,
          max: this.maxMagnitude.get(),
          threshold: this.magnitude / this.maxMagnitude.get() > this.threshold,
        }) */

    if (this.x % 4 != 0 || this.y % 4 != 0) return;

    if (this.magnitude / this.maxMagnitude.get() > this.threshold) {
      // respect original pixel color
      // this.ctx.fillStyle = this.color;
      // Map this to green intensity (0-255)
      const greenIntensity = Math.floor((this.angle / (2 * Math.PI)) * 255);
      // this.ctx.fillStyle = `hsl(${hue + 120}, 100%, 50%)`;
      this.ctx.fillStyle = this.color; //`rgb(0,${greenIntensity},0)`;
      console.log("angle", this.angle, "verd", greenIntensity);
      // const symbols = ["↙", "←", "↖", "↑", "↗", "→", "↘", "↓"];
      const symbols = ["/", "-", "\\", "|", "/", "-", "\\", "|"];
      const sectorSize = (2 * Math.PI) / symbols.length;
      const index = Math.floor(this.angle / sectorSize);

      this.ctx.fillText(symbols[index], this.x, this.y);
    } else {
      // this.ctx.fillStyle = "black";

      console.log(this.threshold);
      if (this.x % 4 != 0 || this.y % 4 != 0) return;

      const rgb = this.color.substring(4, this.color.length - 1).split(",");

      const rgbMedian = +(+rgb[0] * 0.299 + +rgb[1] * 0.587 + +rgb[2] * 0.114);

      // const recolor = `rgb(${0},${Math.min(rgbMedian + 25, 255)},${0})`;
      // const symbols = [" ", ".", ":", "-", "=", "■"];
      const symbols = [" ", "·", ":", "-", "=", "?", "&", "■", "■"];
      const index = Math.max(
        0,
        Math.floor((rgbMedian / 255) * symbols.length) - 1
      );

      console.log(rgbMedian);

      if (rgbMedian > 60) {
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 16;
      }

      //  proves ascii
      this.ctx.font = "8px arial"
      this.ctx.fillStyle = this.color;
      this.ctx.fillText(symbols[index], this.x, this.y, 10);
    }

    // this.ctx.fillRect(this.x, this.y, 1, 1);
  }
}

class AsciiFilterCellRenderer implements ImgCellRenderer {
  x: number;
  y: number;
  threshold: number;
  symbol: string;
  color: string;
  ctx: CanvasRenderingContext2D;

  constructor(
    x: number,
    y: number,
    threshold: number,
    symbol: string,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    this.x = x;
    (this.y = y), (this.symbol = symbol);
    this.color = color;
    this.ctx = ctx;
    this.threshold = threshold;
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.shadowColor = this.color;

    const rgbMedian = +this.color
      .substring(5, this.color.length - 1)
      .split(",")
      .reduce((a, b) => +a + b);

    if (rgbMedian > 380) {
      this.ctx.shadowColor = this.color;
      this.ctx.shadowBlur = this.threshold * 2;
    }

    this.ctx.fillText(this.symbol, this.x, this.y, 10);

    // while the logic for shadows is kind of ok, they are 0 performant, so another canvas to replicat image and expand its size would be more performant

    //this.#ctx.shadowBlur = rgb
  }
}

class MaxMagnitude {
  value: number;

  constructor(init: number) {
    this.value = init;
  }

  get() {
    return this.value;
  }

  set(value: number) {
    this.value = value;
  }
}

class ImgEffectProcessor {
  #imageCellArray: Array<ImgCellRenderer> = [];
  #symbols = [];
  #pixels: ImageData;
  #canvas: HTMLCanvasElement;
  #canvasEffects: HTMLCanvasElement | null;
  #ctx: CanvasRenderingContext2D;
  #img: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement | null,
    canvasEffects: HTMLCanvasElement | null,
    img: HTMLImageElement
  ) {
    if (!canvas) throw new Error("Canvas can't be null");

    this.#canvas = canvas;
    this.#canvasEffects = canvasEffects;
    this.#img = img;

    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Something went wrong getting canvas context");
    this.#ctx = ctx;
    this.#renderImage();
    const w = this.#canvas.width;
    const h = this.#canvas.height;
    this.#pixels = this.#ctx.getImageData(0, 0, w, h);
    console.log(this.#pixels.data.length);
    console.log(this.#pixels.width);
    console.log(this.#pixels.height);
  }

  #renderImage() {
    this.#canvas.width = this.#img.width;
    this.#canvas.height = this.#img.height;
    if (this.#canvasEffects) {
      this.#canvasEffects.width = this.#img.width;
      this.#canvasEffects.height = this.#img.height;
    }
    this.#ctx.drawImage(this.#img, 0, 0);
  }

  #convertToSymbol(averageColorValue: number) {
    // can be made dynamic

    // interesting tiling
    // const symbols = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
    //const symbols = ['', '.', ':', '=','▤', '▦', '▧', '▩',]

    const symbols = [" ", ".", ";", "=", "x", "░", "▒", "█"];
    return symbols[
      Math.max(0, Math.floor((averageColorValue * symbols.length) / 255) - 1)
    ];
  }
  /*   // Ascii effect version -> Refactor into own class
    #scanImage(cellSize: number) {
      this.#imageCellArray = [];
      for (let y = 0; y < this.#pixels.height; y += cellSize) {
        for (let x = 0; x < this.#pixels.width; x += cellSize) {
          const posX = x * 4;
          const posY = y * 4;
          const pos = posY * this.#pixels.width + posX;
  
          const pixel = this.#pixels.data;
  
          if (pixel[pos + 3] > 128) {
            const red = pixel[pos];
            const green = pixel[pos + 1];
            const blue = pixel[pos + 2];
            const color = `rgba(${red + 20},${green + 20},${blue + 20},0.6)`;
            const averageColorValue = (red + green + blue) / 3;
            const recolor = `rgb(${0},${averageColorValue},${0})`;
            const symbol = this.#convertToSymbol(averageColorValue);
            if (averageColorValue > 60)
              this.#imageCellArray.push(
                new AsciiFilterCellRenderer(x, y, cellSize, symbol, recolor, this.#ctx)
              );
          }
        }
      }
      console.log(this.#imageCellArray);
    } */

  #scanImage(cellSize: number) {
    this.#imageCellArray = [];
    // first we'll do a simple 3x3 sobel kernel, later we will make it dynamic.
    const sobelY = [
        [1, 0, -1],
        [2, 0, -2],
        [1, 0, -1],
      ],
      sobelX = [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1],
      ];

    const delta = 1;

    const max = new MaxMagnitude(0);

    for (let y = 0; y < this.#pixels.height; y++) {
      for (let x = 0; x < this.#pixels.width; x++) {
        // now it will be constant but when kernels are dynamic it must be size/2 floored

        const pixel = this.#pixels.data;
        const posX = x * 4;
        const posY = y * 4;
        const pos = posY * this.#pixels.width + posX;

        const red = pixel[pos];
        const green = pixel[pos + 1];
        const blue = pixel[pos + 2];

        // later we will be able to choose luminance approach, naive or nuanced

        let sobelYValue = 0;
        sobelY.forEach((row, indexY) => {
          indexY -= delta;
          let sobelYRowValues = 0;
          row.forEach((value, indexX) => {
            const nx = x + indexX - delta;
            const ny = y + indexY - delta;

            if (
              nx >= 0 &&
              nx < this.#pixels.width &&
              ny >= 0 &&
              ny < this.#pixels.height
            ) {
              const npos = (ny * this.#pixels.width + nx) * 4;

              const red = pixel[npos];
              const green = pixel[npos + 1];
              const blue = pixel[npos + 2];

              let rLuminance = red * 0.299;
              let gLuminance = green * 0.587;
              let bLuminance = blue * 0.114;

              // add all values
              sobelYRowValues += (rLuminance + gLuminance + bLuminance) * value;
            }
          });
          // accumulate pixel value
          sobelYValue += sobelYRowValues;
        });

        // ugly, but we dont care yet, this is playground not CODER OF THE YEAR
        let sobelXValue = 0;
        sobelX.forEach((row, indexY) => {
          indexY -= delta;
          let sobelXRowValues = 0;
          row.forEach((value, indexX) => {
            const nx = x + indexX - delta;
            const ny = y + indexY - delta;

            if (
              nx >= 0 &&
              nx < this.#pixels.width &&
              ny >= 0 &&
              ny < this.#pixels.height
            ) {
              const npos = (ny * this.#pixels.width + nx) * 4;

              const red = pixel[npos];
              const green = pixel[npos + 1];
              const blue = pixel[npos + 2];

              let rLuminance = red * 0.299;
              let gLuminance = green * 0.587;
              let bLuminance = blue * 0.114;
              // add all values
              sobelXRowValues += (rLuminance + gLuminance + bLuminance) * value;
            }
          });
          // accumulate pixel value
          sobelXValue += sobelXRowValues;
        });

        const color = `rgb(${red},${green},${blue})`;
        const magnitude = Math.sqrt(
          Math.pow(sobelYValue, 2) + Math.pow(sobelYValue, 2)
        );
        if (magnitude > max.get()) max.set(magnitude);

        const angle = Math.atan2(sobelXValue, sobelYValue);

        this.#imageCellArray.push(
          new SobelCellRenderer(
            x,
            y,
            cellSize / 100,
            color,
            magnitude,
            (angle + Math.PI) % (2 * Math.PI),
            max,
            this.#ctx
          )
        );
      }
    }
    console.log(this.#imageCellArray);
    console.log(this.#pixels.data);
  }

  render(cellSize: number = 1) {
    this.#scanImage(cellSize);
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#ctx.fillStyle = "#000000";
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#imageCellArray.forEach((iCell) => iCell.draw());
  }
}

export default function Home() {
  const cnvs = useRef<HTMLCanvasElement>(null);
  const shadowCnvs = useRef<HTMLCanvasElement>(null);
  const imgProcessor = useRef<ImgEffectProcessor>(null);

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files == null || !cnvs.current) return;

    const img = new Image();

    img.onload = () => {
      const imgP = new ImgEffectProcessor(
        cnvs.current,
        shadowCnvs.current,
        img
      );
      imgProcessor.current = imgP;
      imgProcessor.current.render(5);
    };

    img.src = URL.createObjectURL(e.target.files[0]);
  }

  useEffect(() => {
    // load image
  }, []);

  function handleResolutionChange(event: ChangeEvent<HTMLInputElement>): void {
    imgProcessor.current?.render(+event.target.value);
  }

  return (
    <div className="bg-slate-900 h-screen w-screen flex flex-col text-teal-200">
      <h1>ascii filter</h1>

      <canvas
        ref={cnvs}
        id="render"
        className=" bg-black border border-teal-200 "
      />
      {/* <canvas
        ref={shadowCnvs}
        id="render"
        className=" bg-black border border-teal-200"
      /> */}

      <div id="controls" className="flex p-2 flex-col fixed top-2 right-2">
        <input
          type="file"
          accept="image/*"
          id="img"
          name="img"
          onChange={handleImageUpload}
        />
        <label id="resolutionLabel" htmlFor="resolution" className="" />
        <input
          id="resolution"
          type="range"
          name="resolution"
          min="1"
          max="100"
          onChange={handleResolutionChange}
        />
      </div>
    </div>
  );
}
