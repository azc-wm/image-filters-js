import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect, useRef, type ChangeEvent } from "react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
class ImgCell {
  x: number;
  y: number;
  symbol: string;
  color: string;
  #ctx: CanvasRenderingContext2D;
  constructor(x: number, y: number, symbol: string, color: string, ctx: CanvasRenderingContext2D) {
    this.x = x;
    this.y = y,
      this.symbol = symbol;
    this.color = color;
    this.#ctx = ctx;
  }

  draw() {
    this.#ctx.fillStyle = this.color;
    this.#ctx.fillText(this.symbol, this.x, this.y);
    this.#ctx.shadowColor = this.color;
    // while the logic for shadows is kind of ok, they are 0 performant, so another canvas to replicat image and expand its size would be more performant
    //const rgb = this.color.substring(4,this.color.length -1).split(",").reduce( (a,b) => +a + +b, 0) 
    //this.#ctx.shadowBlur = rgb

  }
}


class ImgEffectProcessor {
  #imageCellArray: Array<ImgCell> = [];
  #symbols = [];
  #pixels: ImageData;
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #img: HTMLImageElement;


  constructor(canvas: HTMLCanvasElement | null, img: HTMLImageElement) {

    if (!canvas) throw new Error("Canvas can't be null")

    this.#canvas = canvas;
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
    this.#ctx.drawImage(this.#img, 0, 0);
  }

  #convertToSymbol(averageColorValue: number) {
    // can be made dynamic
    const symbols = [" ", "·", ".", ",", "-", "~", "+", "=", "e", "$", "0", "@"];
    return symbols[Math.max(0, Math.floor(averageColorValue * symbols.length / 255) - 1)]
  }

  #scanImage(cellSize: number) {
    this.#imageCellArray = [];
    for (let y = 0; y < this.#pixels.height; y += cellSize) {
      for (let x = 0; x < this.#pixels.width; x += cellSize) {
        const posX = x * 4;
        const posY = y * 4;
        const pos = (posY * this.#pixels.width) + posX;

        const pixel = this.#pixels.data;

        if (pixel[pos + 3] > 128) {
          const red = pixel[pos];
          const green = pixel[pos + 1];
          const blue = pixel[pos + 2];
          const color = `rgb(${red},${green},${blue})`
          const averageColorValue = (red + green + blue) / 3
          const symbol = this.#convertToSymbol(averageColorValue)
          if (averageColorValue > 60) this.#imageCellArray.push(new ImgCell(x, y, symbol, color, this.#ctx))
        }
      }
    }
    console.log(this.#imageCellArray)
  }

  render(cellSize: number = 1) {
    this.#scanImage(cellSize)
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#imageCellArray.forEach(iCell => iCell.draw())
  }
}

export default function Home() {

  const cnvs = useRef<HTMLCanvasElement>(null);
  const imgProcessor = useRef<ImgEffectProcessor>(null);

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {

    if (e.target.files == null || !cnvs.current) return;

    const img = new Image();

    img.onload = () => {
      const imgP = new ImgEffectProcessor(cnvs.current, img);
      imgProcessor.current = imgP;
      imgProcessor.current.render(5);
    };

    img.src = URL.createObjectURL(e.target.files[0])
  }

  useEffect(() => {
    // load image
  }, [])

  function handleResolutionChange(event: ChangeEvent<HTMLInputElement>): void {
    imgProcessor.current?.render(+event.target.value)
  }

  return <div className="bg-slate-900 h-screen w-screen flex flex-col text-teal-200">
    <h1>
      ascii filter
    </h1>

    <div className="w-8/12 h-3/4 flex overflow-scroll p-2">
      <canvas ref={cnvs} id="render" className="w-full bg-black border border-teal-200"></canvas>
    </div>

    <div id="controls" className="flex p-2 flex-col fixed top-2 right-2">
      <input type="file" accept="image/png,image/jpg,image/webp" id="img" name="img" onChange={handleImageUpload} />
      <label id="resolutionLabel" htmlFor="resolution" className="" />
      <input id="resolution" type="range" name="resolution" min="1" max="50" defaultValue="5" onChange={handleResolutionChange} />
    </div>
  </div>
}
