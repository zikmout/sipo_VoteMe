contract sipoPoll{
    address manager;
    uint public total_voters = 0;
    uint public start_date;
    uint public end_date;
    uint public yes_vote_count = 0;
    uint public no_vote_count = 0;
    string public question;

    mapping(address => uint) private votes;

    function sipoPoll(string _question, uint _start_date, uint _end_date) {
        manager = msg.sender;
        //do some checks for the authenticity of the dates;
        start_date = _start_date;
        end_date = _end_date;
        question = _question;
    }
    
    function getStartDate() returns (uint) {
        return start_date;
    }

    function getEndDate() returns (uint) {
        return end_date;
    }

    function getQuestion() returns (string) {
        return question;
    }

    function getTotalVoters() returns (uint) {
        if (msg.sender == manager) {
            return total_voters;
        } else {
            return 0;
        }
    }

    function sipoPollResult() returns (int) {
        if (now > end_date) {
            bool sign = false;
            if (yes_vote_count == no_vote_count) {
                return 0;
            } else if (yes_vote_count - no_vote_count > 0) {
               sign = true;
            }
            uint total = yes_vote_count + no_vote_count;
            int result = 0;
            if (sign == false) {
                result = (int(no_vote_count / total)) * 100;
            } else { 
               result = (int(yes_vote_count / total)) * 100;
            }
            if (sign == false) {
                result *= -1;
            }
            return result;
        } else {
            return 0;
        }
    }
    function addVoter(address[] arrayVoters) returns (bool) {
        if (msg.sender == manager && now <= end_date) {
            for (uint i = 0; i < arrayVoters.length; i++) {
                address voter = arrayVoters[i];
                votes[voter] = 2;
                total_voters += 1;
            }
            return true;
        } else {
            return false;
        }
    }

    function vote(bool ans) returns (bool) {
        if (now <= end_date && votes[msg.sender] == 2){
            if (ans == true) {
                votes[msg.sender] = 1;
                yes_vote_count += 1;
            } else if (ans == false) {
                votes[msg.sender] = 0;
                no_vote_count += 1;
            }
            return true;
        } else {
            return false;
        }
    }

    function userHasRightsToVote() returns (bool) {
        if (now <= end_date && votes[msg.sender] == 2) {
            return true;
        } else {
            return false;
        }
    }

    function hasRightsToVote(address user) returns (bool) {
        if (now <= end_date && votes[user] == 2) {
            return true;
        } else {
            return false;
        }
    }
}
