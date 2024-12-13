import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect, useRef, type ChangeEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
class ImgCell {
  x: number;
  y: number;
  cellSize: number;
  symbol: string;
  color: string;

  #ctx: CanvasRenderingContext2D;

  constructor(
    x: number,
    y: number,
    cellSize: number,
    symbol: string,
    color: string,
    ctx: CanvasRenderingContext2D
  ) {
    this.x = x;
    (this.y = y), (this.symbol = symbol);
    this.color = color;
    this.#ctx = ctx;
    this.cellSize = cellSize;
  }

  draw() {
    this.#ctx.fillStyle = this.color;
    this.#ctx.shadowColor = this.color;
    
    const rgbMedian = +this.color.substring(5, this.color.length -1).split(",").reduce((a,b) => +a + b)
    
    if (rgbMedian > 380) {
      this.#ctx.shadowColor = this.color;
      this.#ctx.shadowBlur = this.cellSize * 2;
    }

    this.#ctx.fillText(this.symbol, this.x, this.y, 10);

    // while the logic for shadows is kind of ok, they are 0 performant, so another canvas to replicat image and expand its size would be more performant

    //this.#ctx.shadowBlur = rgb
  }
}

class ImgEffectProcessor {
  #imageCellArray: Array<ImgCell> = [];
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
    const symbols = [" ", ".", ",", "-", "~", "▪", "=", "⯀"];
    return symbols[
      Math.max(0, Math.floor((averageColorValue * symbols.length) / 255) - 1)
    ];
  }

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
              new ImgCell(x, y, cellSize, symbol, recolor, this.#ctx)
            );
        }
      }
    }
    console.log(this.#imageCellArray);
  }

  render(cellSize: number = 1) {
    this.#scanImage(cellSize);
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#canvasEffects &&
      this.#canvasEffects
        .getContext("2d")!
        .clearRect(0, 0, this.#canvasEffects.width, this.#canvasEffects.height);
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
          defaultValue="5"
          onChange={handleResolutionChange}
        />
      </div>
    </div>
  );
}
