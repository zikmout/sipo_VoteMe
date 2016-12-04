
contract SimpleConstructorArray {
  uint[3] public storedData;

  function SimpleConstructorArray(uint[3] x, uint[3] y) {
    storedData = x;
  }

  function get() returns (uint[3]) {
    return storedData;
  }
}
