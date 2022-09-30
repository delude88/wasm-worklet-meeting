import createModule from "../wasm/build/main.js";

const MAX_ITERATION = 600

const REAL_SET = {start: -2, end: 1}
const IMAGINARY_SET = {start: -1, end: 1}

export function mandelbrot(cX: number, cY: number): number {
    let z = {x: 0, y: 0}, n = 0, p, d;
    do {
        p = {
            x: Math.pow(z.x, 2) - Math.pow(z.y, 2),
            y: 2 * z.x * z.y
        }
        z = {
            x: p.x + cX,
            y: p.y + cY
        }
        d = Math.sqrt(Math.pow(z.x, 2) + Math.pow(z.y, 2))
        n += 1
    } while (d <= 2 && n < MAX_ITERATION)
    if (d <= 2) {
        return 0
    }
    return n
}

function draw(canvasContext: CanvasRenderingContext2D, arr: number[], colors: string[]) {
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height)
    const WIDTH = canvasContext.canvas.width
    const HEIGHT = canvasContext.canvas.height
    let index = 0;
    for (let i = 0; i < WIDTH; i++) {
        for (let j = 0; j < HEIGHT; j++) {
            index = j * WIDTH + i
            const v = arr[index]
            canvasContext.fillStyle = colors[v]
            canvasContext.fillRect(i, j, 1, 1)
        }
    }
}

export function runJavascriptBenchmark(canvasContext: CanvasRenderingContext2D): Promise<number> {
    return new Promise<number>((resolve) => {
        const WIDTH = canvasContext.canvas.width
        const HEIGHT = canvasContext.canvas.height

        const colors = new Array(16).fill(0).map((_, i) => i === 0 ? '#000' : `#${((1 << 24) * Math.random() | 0).toString(16)}`)
        const arr = new Array(WIDTH * HEIGHT).fill(0);

        const start = performance.now();
        for (let i = 0; i < WIDTH; i++) {
            for (let j = 0; j < HEIGHT; j++) {
                const complex = {
                    x: REAL_SET.start + (i / WIDTH) * (REAL_SET.end - REAL_SET.start),
                    y: IMAGINARY_SET.start + (j / HEIGHT) * (IMAGINARY_SET.end - IMAGINARY_SET.start)
                }
                const m = mandelbrot(complex.x, complex.y);
                if (m > 0) {
                    arr[j * WIDTH + i] = m % colors.length
                }
            }
        }
        const end = performance.now()

        draw(canvasContext, arr, colors);

        resolve(end - start);
    })
}

export function runWASMBenchmark(canvasContext: CanvasRenderingContext2D): Promise<number> {
    return createModule()
        .then(module => {
            const another = new module.Another(MAX_ITERATION);
            const WIDTH = canvasContext.canvas.width
            const HEIGHT = canvasContext.canvas.height
            const colors = new Array(16).fill(0).map((_, i) => i === 0 ? '#000' : `#${((1 << 24) * Math.random() | 0).toString(16)}`)

            const start = performance.now();
            const result = another.benchmark(WIDTH, HEIGHT, colors.length);
            const end = performance.now();

            for (let i = 0; i < WIDTH; i++) {
                for (let j = 0; j < HEIGHT; j++) {
                    const index = j * WIDTH + i
                    const v = module.HEAPU32[(result[0] + index * Uint32Array.BYTES_PER_ELEMENT) / Uint32Array.BYTES_PER_ELEMENT];
                    canvasContext.fillStyle = colors[v];
                    canvasContext.fillRect(i, j, 1, 1)
                }
            }
            // Free the buffer (yeah, this is C++ related code inside JS)
            module._free(result[0]);

            return end - start;
        })
}


export function runWASMBenchmarkAlt(canvasContext: CanvasRenderingContext2D): Promise<number> {
    return createModule()
        .then(module => {
            const another = new module.Another(MAX_ITERATION);
            const WIDTH = canvasContext.canvas.width
            const HEIGHT = canvasContext.canvas.height
            canvasContext.clearRect(0, 0, WIDTH, HEIGHT)

            const colors = new Array(16).fill(0).map((_, i) => i === 0 ? '#000' : `#${((1 << 24) * Math.random() | 0).toString(16)}`)
            const arr = new Array(WIDTH * HEIGHT).fill(0);

            const start = performance.now();
            for (let i = 0; i < WIDTH; i++) {
                for (let j = 0; j < HEIGHT; j++) {
                    const complex = {
                        x: REAL_SET.start + (i / WIDTH) * (REAL_SET.end - REAL_SET.start),
                        y: IMAGINARY_SET.start + (j / HEIGHT) * (IMAGINARY_SET.end - IMAGINARY_SET.start)
                    }
                    const m = another.mandelbrot(complex.x, complex.y);
                    if (m > 0) {
                        arr[j * WIDTH + i] = m % colors.length
                    }
                }
            }
            const end = performance.now();

            draw(canvasContext, arr, colors);

            return end - start;
        })
}