contract HelloWorld {
      event Print(string out);
      function() { Print("Hello, World!"); }

      function HelloWorld() {
        Print('Simon');
      }
}
