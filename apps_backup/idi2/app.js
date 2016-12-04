// requires
var fs = require ('fs');
var prompt = require('prompt');
var erisC = require('eris-contracts');

// NOTE. On Windows/OSX do not use localhost. find the
// url of your chain with:
// docker-machine ls
// and find the docker machine name you are using (usually default or eris).
// for example, if the URL returned by docker-machine is tcp://192.168.99.100:2376
// then your erisdbURL should be http://192.168.99.100:1337/rpc
var erisdbURL = "http://localhost:1337/rpc";

// get the abi and deployed data squared away
var contractData = require('./jobs_output.json');
var idisContractAddress = contractData["deployStorage"];
var idisAbi = JSON.parse(fs.readFileSync("./abi/" + idisContractAddress));

// properly instantiate the contract objects manager using the erisdb URL
// and the account data (which is a temporary hack)
var accountData = require('./accounts.json');
var contractsManager = erisC.newContractManagerDev(erisdbURL, accountData.tot_full_000);

// properly instantiate the contract objects using the abi and address
var idisContract = contractsManager.newContractFactory(idisAbi).at(idisContractAddress);

function addVoters(callback){
    idisContract.addVoters(["49CA2456F65B524BDEF50217AE539B8E10B37421", "49CA2456F65B524BDEF50217AE539B8E10B37421", "49CA2456F65B524BDEF50217AE539B8E10B37421"], function (error, result) {
        if (error) throw error;
        else {
            //console.log(reult);
            callback(false, result);
        }
    })
}

addVoters(function(err, res) {
    console.log(res);
});
