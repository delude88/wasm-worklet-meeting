#include "emscripten/bind.h"
#include <iostream>
#include <chrono>
#include <math.h>

class Main {
 public:
  Main() : level(1.0) {
  }

  void setLevel(float l) {
    level = l;
  }

  int getLevel() {
    return level;
  }

  float amplify(float value) {
    // value will be between 0 and 1
    return value * level;
  }

 private:
  float level;
};

// That's the glue :D
EMSCRIPTEN_BINDINGS(CLASS_Main) {
    emscripten::class_<Main>("Main")
        .constructor()

        .function("setLevel",
                  &Main::setLevel)

        .function("getLevel",
                  &Main::getLevel)

        .function("amplify",
                  &Main::amplify);
}

struct buffer {
  unsigned int pointer;
  unsigned int size;
};

struct set {
  int start;
  int end;
};

class Another {
 public:
  Another(unsigned int iterations) : iterations_(iterations) {}

  uint32_t mandelbrot(double cX, double cY) {
    double zX = 0, zY = 0, pX, pY;
    uint32_t d, n = 0;
    do {
      pX = pow(zX, 2) - pow(zY, 2);
      pY = 2 * zX * zY;
      zX = pX + cX;
      zY = pY + cY;
      d = sqrt(pow(zX, 2) + pow(zY, 2));
      n += 1;
    } while (d <= 2 && n < iterations_);
    if (d <= 2) {
      // inside the mandelbrot set
      return 0;
    }
    return n;
  }

  buffer benchmark(uint32_t width, uint32_t height, uint32_t numColors) {
    std::cout << "Performing benchmark for " << width << "x" << height << " and " << numColors << " colors"
              << std::endl;
    // Initialize internal buffer (1D array with length of width * height)
    buffer buffer;
    uint32_t *pixelData = (uint32_t *) malloc(width * height * sizeof(uint32_t));

    set REAL_SET = {.start = -2, .end = 1};
    set IMAGINARY_SET = {.start = -1, .end =  1};
    double cX, cY;
    uint32_t  m;
    for (uint32_t i = 0; i < width; i++) {
      for (uint32_t j = 0; j < height; j++) {
        cX = REAL_SET.start + ((double) i / width) * (REAL_SET.end - REAL_SET.start);
        cY = IMAGINARY_SET.start + ((double) j / height) * (IMAGINARY_SET.end - IMAGINARY_SET.start);
        m = mandelbrot(cX, cY);
        if (m > 0) {
          pixelData[j * width + i] = (uint32_t) m % numColors;
        }
      }
    }
    buffer.pointer = (uint32_t) pixelData;
    buffer.size = width * height;
    std::cout << "Written array of size " << buffer.size << " at " << buffer.pointer << std::endl;
    return buffer;
  }

  void doIt() {
    std::cout << "Demonstrating how fast C++ is: Starting loop" << std::endl;
    std::chrono::steady_clock::time_point begin = std::chrono::steady_clock::now();
    //TODO: Sort a million string array by name
    int bla = 0;
    for (int i = 0; i < 99999999; i++) {
      bla += (bla * i * 299) / 299;
    }
    std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();
    std::cout << "End of loop - needed time: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end - begin).count() << "[ms]" << std::endl;
  }

 private:
  int iterations_;
};

EMSCRIPTEN_BINDINGS(CLASS_Another) {
    emscripten::value_array<buffer>("buffer")
        .element(&buffer::pointer)
        .element(&buffer::size);

    emscripten::class_<Another>("Another")
    .constructor<int>()

    .function("doIt",
    &Another::doIt)

    .function("benchmark",
    &Another::benchmark)

    .function("mandelbrot",
    &Another::mandelbrot);
}