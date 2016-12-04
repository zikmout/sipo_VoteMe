contract IdisContractsFTW {
    address manager;

    mapping(address => uint) public votes;

    function IdisContractsFTW() {
        manager = msg.sender;
    }

    function addVoter(address[] arrayVoters) returns (bool) {
        if (msg.sender == manager) {
            for (uint i = 0; i < arrayVoters.length; i++) {
                address voter = arrayVoters[i];
                votes[voter] = 2;
            }
            return true;
        } else {
            return false;
        }
    }

    function vote(bool ans) returns (bool) {
        if (votes[msg.sender] == 2){
            if (ans == true) {
                votes[msg.sender] = 1;
            } else if (ans == false) {
                votes[msg.sender] = 0;
            }
            return true;
        } else {
            return false;
        }
    }

    function userHasRightsToVote() returns (bool) {
        if (votes[msg.sender] == 2) {
            return true;
        } else {
            return false;
        }
    }

    function hasRightsToVote(address user) returns (bool) {
        if (votes[user] == 2) {
            return true;
        } else {
            return false;
        }
    }
}
