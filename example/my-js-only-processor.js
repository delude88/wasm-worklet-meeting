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
 *
 * ringbuf.js
 */
import createModule from "../wasm/build/main.js"

class MyJsOnlyProcessor extends AudioWorkletProcessor {
    running = true
    main = undefined
    level = 1

    constructor() {
        super();
        console.log("Sample rate", sampleRate) // <-- there are a few globals available

        console.log("module", createModule)

        this.port.onmessage = (event) => {
            const raw = event.data // <-- we only can send and receive one string (!)
            const message = JSON.parse(raw)
            // Expect object with { key: string, value: any }
            const key = message.key
            const value = message.value
            if(key === "level") {
                // Set level
                console.log(`Setting level to ${value}`)
                this.level = value
                if(this.main) {
                    this.main.setLevel(this.level)
                }
            } else if(key === "close") {
                this.running = false
            }
        }

        this.init();
    }

    init() {
        // createModule is async
        createModule()
            .then(module => {
                this.main = new module.Main();
                this.main.setLevel(this.level)
            })
    }

    process(input, output, _params) {
        // Number of input channels === number of output channels (!)

        // is there input and output?
        if(this.main) {
            if(input && output) {
                // For each channel ...
                for (let channel = 0; channel < input[0].length; channel++) {
                    // Process each sample ...
                    for (let sample = 0; sample < input[0][channel].length; sample++) {
                        const value = input[0][channel][sample]
                        const result = this.main.amplify(value);
                        output[0][channel][sample] = result
                    }
                }
            }
        }

        // Continue
        return this.running;
    }
}

registerProcessor("my-js-only-processor", MyJsOnlyProcessor)