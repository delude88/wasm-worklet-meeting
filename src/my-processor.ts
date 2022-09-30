/**
 * 128 samples per call
 *
 * 44100 Hz = 44100 samples / second
 *
 * 344 times / second
 *
 * NO INTERNET ACCESS HERE
 *
 * NO AUDIO ACCESS HERE
 *
 */
import createModule from "../wasm/build/main.js"

class MyProcessor extends AudioWorkletProcessor {
    private main: any = undefined
    private level = 1
    private running = true

    constructor() {
        super();
        console.log("Sample rate", sampleRate) // <-- there are a few globals available

        this.port.onmessage = (event) => {
            const raw = event.data // <-- we only can send and receive one string (!)
            const message = JSON.parse(raw)
            // Expect object with { key: string, value: any }
            const key = message.key
            const value = message.value
            if (key === "level") {
                // Set level
                console.log(`Setting level to ${value}`)
                this.level = value
                if (this.main) {
                    this.main.setLevel(this.level)
                }
            } else if (key === "close") {
                this.running = false
            }
        }

        this.init();
    }

    init() {
        createModule()
            .then(module => {
                this.main = new module.Main()
                this.main.setLevel(this.level)
            })
    }

    process(input, output, _params) {
        // Number of input channels === number of output channels (!)

        // is there input and output?
        if (this.main) {
            if (input && output) {
                // For each channel ...
                for (let channel = 0; channel < input[0].length; channel++) {
                    // Process each sample ...
                    for (let sample = 0; sample < input[0][channel].length; sample++) {
                        output[0][channel][sample] = this.main.amplify(
                            input[0][channel][sample]
                        );
                    }
                }
            }
        }

        // Continue
        return this.running;
    }
}

registerProcessor("my-processor", MyProcessor)