#include "emscripten/bind.h"
#include <iostream>
#include <chrono>

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

class Another {
 public:
  Another() {}

  void doIt() {
    std::cout << "Demonstrating how fast C++ is: Starting loop" << std::endl;
    std::chrono::steady_clock::time_point begin = std::chrono::steady_clock::now();
    //TODO: Sort a million string array by name
    int bla = 0;
    for(int i = 0; i < 99999999; i++) {
        bla += (bla * i * 299) / 299;
    }
    std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();
    std::cout << "End of loop - needed time: " << std::chrono::duration_cast<std::chrono::milliseconds>(end - begin).count() << "[ms]" << std::endl;
  }
};

EMSCRIPTEN_BINDINGS(CLASS_Another) {
    emscripten::class_<Another>("Another")
        .constructor()

        .function("doIt",
                  &Another::doIt);
}