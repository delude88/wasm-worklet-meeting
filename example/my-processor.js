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
import Module from "../wasm/build/main.js"

class MyProcessor extends AudioWorkletProcessor {
    running = true
    main = undefined

    constructor() {
        super();
        console.log("Sample rate", sampleRate) // <-- there are a few globals available

        this.main = new Module.Main();

        this.port.onmessage = (event) => {
            const raw = event.data // <-- we only can send and receive one string (!)
            const message = JSON.parse(raw)
            // Expect object with { key: string, value: any }
            const key = message.key
            const value = message.value
            if(key === "level") {
                // Set level
                console.log(`Setting level to ${value}`)
                this.main.setLevel(value)
            } else if(key === "close") {
                this.running = false
            }
        }
    }

    process(input, output, _params) {
        // Number of input channels === number of output channels (!)

        // is there input and output?
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

        // Continue
        return this.running;
    }
}

registerProcessor("my-processor", MyProcessor)