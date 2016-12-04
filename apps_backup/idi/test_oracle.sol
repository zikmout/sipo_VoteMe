contract tetsTime{
     
    function time() returns (uint) {
	uint time_test;
	time_test = block.timestamp;
	return time_test;
    }
    
}
