contract IdisContractsFTW {
  address public manager;

  function IdisContractsFTW() {
      manager = msg.sender;
  }

  function addVoters (address[] arrayVoters) constant returns (address[]){
      if (msg.sender == manager) {
          return (arrayVoters);
      } else {
            return (arrayVoters);
        }
  }

  function hasRightToVote (address user) constant returns (bool) {
      return (true);
  }
}
