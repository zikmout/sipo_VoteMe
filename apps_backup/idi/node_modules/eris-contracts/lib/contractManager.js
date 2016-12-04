/**
 * @file contract.js
 * @author Marek Kotewicz <marek@ethdev.com>
 * @author Andreas Olofsson <andreas@erisindustries.com>
 * @date 2014
 * @module contract
 */

const generic = require('@nodeguy/generic')
const _ = generic._
const I = require('iteray')
const R = require('ramda')
var utils = require('./utils/utils');
var SolidityEvent = require('./solidity/event');
var SolidityFunction = require('web3/lib/web3/function');
const is = require('@nodeguy/type').is
var coder = require('web3/lib/solidity/coder');

// TODO remove.
var pipe = null;

function ContractManager(pipe){
    this._pipe = pipe;
}

ContractManager.prototype.newContractFactory = function(abi){
    return new ContractFactory(abi, this._pipe);
};

ContractManager.prototype.pipe = function(){
    return this._pipe;
};

ContractManager.prototype.erisDb = function(){
    return this._pipe.erisDb();
};

/**
 * Should be called to encode constructor params
 *
 * @method encodeConstructorParams
 * @param {Array} abi
 * @param {Array} params
 */
var encodeConstructorParams = function (abi, params) {
    return abi.filter(function (json) {
            return json.type === 'constructor' && json.inputs.length === params.length;
        }).map(function (json) {
            return json.inputs.map(function (input) {
                return input.type;
            });
        }).map(function (types) {
            return coder.encodeParams(types, params);
        })[0] || '';
};

// Remove the prefix '0x' that web3 adds.
const wrapPayload = (payload) =>
  R.assoc('data', payload.data.slice(2), payload)

// Add the prefix '0x' that web3 is expecting.
const wrapCallback = (callback) =>
  (error, output) =>
    error ? callback(error) : callback(null, '0x' + output)

// Wrap our 'pipe' to make it look like web3's 'eth'.
const eth = (pipe) => ({
  call: (payload, defaultBlock, callback) =>
    pipe.call(wrapPayload(payload), wrapCallback(callback)),

  sendTransaction: (payload, callback) =>
    pipe.transact(wrapPayload(payload), wrapCallback(callback))
})

// Convert Eris types to Web3 types.
const erisToWeb3 = generic.create()

erisToWeb3.method(_,
  R.identity
)

erisToWeb3.method([is(String)],
  R.concat('0x')
)

erisToWeb3.method([is(Array)],
  I.map(erisToWeb3)
)

// Convert Web3 types to Eris types.
const web3ToEris = generic.create()

web3ToEris.method(_,
  R.identity
)

web3ToEris.method([is(String)],
  I.slice(2, Infinity)
)

const wrapFunction = (formatter, solidityFunction) => {
  const wrapMethod = (name) =>
    function (...args) {
      const web3Args = erisToWeb3(args)

      if ((web3Args.length > 0) && (is(Function, I.get(-1, web3Args)))) {
        const callback = I.get(-1, web3Args)

        const callbackWrapper = (error, result) =>
          error
            ? callback(error)
            : callback(null, formatter(web3ToEris(result)))

        return solidityFunction[name](...I.concat(
          I.slice(0, -1, web3Args),
          callbackWrapper
        ))
      } else {
        // Never call the Solidity function in web3's synchronous mode.
        return solidityFunction[name](...web3Args.concat(R.identity))
      }
    }

  const wrapped = I.to(Object, I.map(
    (name) => [name, wrapMethod(name)],
    ['call', 'sendTransaction']
  ))

  Object.setPrototypeOf(wrapped, solidityFunction)
  return wrapped
}

/**
 * Should be called to add functions to contract object
 *
 * @method addFunctionsToContract
 * @param {Contract} contract
 * @param {Array} abi
 * TODO
 * @param {function} pipe - The pipe (added internally).
 * @param {function} outputFormatter - the output formatter (added internally).
 */
var addFunctionsToContract = function (contract, pipe, outputFormatter) {
    contract.abi.filter(function (json) {
        return json.type === 'function';
    }).map(function (json) {
        // Add formatter, or if no formatter exists just pass data through.
        var of = outputFormatter || function(json, output){return output};

        const formatter = (result) =>
          of(json.outputs, result)

        return wrapFunction(
          formatter,
          new SolidityFunction(eth(pipe), json, contract.address)
        )
    }).forEach(function (f) {
        f.attachToContract(contract);
    });
};

/**
 * Should be called to add events to contract object
 *
 * @method addEventsToContract
 * @param {Contract} contract
 * @param {Array} abi
 */
var addEventsToContract = function (contract, pipe) {
    contract.abi.filter(function (json) {
        return json.type === 'event';
    }).map(function (json) {
        return new SolidityEvent(json, contract.address, pipe);
    }).forEach(function (e) {
        e.attachToContract(contract);
    });
};

/**
 * @deprecated
 */
function contract(abi) {
    console.log("DEPRECATED: Don't use the method 'contractsModule.contracts(abi)', instead use 'contractsModule.newContractManager(pipe)' to get a 'ContractManager' instance, and create factories through 'manager.newContractFactory(abi)");
    return new ContractFactory(abi);
}

/**
 * @deprecated
 */
function init(pipeIn){
    console.log("DEPRECATED: Only needed for 'contractsModule.contracts(abi)' which should no longer be used.");
    pipe = pipeIn;
}

/**
 *
 * @param {Array} abi - The abi object.
 * @param {Object} edbPipe - The eris-db pipe.
 * @constructor
 */
var ContractFactory = function (abi, edbPipe) {
    this.abi = abi;
    if(!edbPipe) {
        this._pipe = pipe;
    } else {
        this._pipe = edbPipe;
    }
};

/**
 * Should be called to create new contract on a blockchain
 *
 * @method new
 * @param {*} [contract] constructor param1 (optional)
 * @param {*} [contract] constructor param2 (optional)
 * @param {Object} contract transaction object (required)
 * @param {Function} callback
 */
ContractFactory.prototype.new = function () {
    // parse arguments
    var options = {}; // required!
    var callback;

    var args = Array.prototype.slice.call(arguments);
    if (utils.isFunction(args[args.length - 1])) {
        callback = args.pop();
    }

    var last = args[args.length - 1];
    if (utils.isObject(last) && !utils.isArray(last)) {
        options = args.pop();
    }
    if (!options.hasOwnProperty('data')){
        options.data = '';
    }
    if (!options.hasOwnProperty('to')){
        options.to = '';
    }
    try {
        // throw an error if there are no options
        options.data += encodeConstructorParams(this.abi, args);

        var that = this;

        this._pipe.transact(options, function (error, address) {
            if (error)
                callback(error);
            else
                that.at(address, callback);
        });
    } catch (error){
        callback(error);
    }
};

/**
 * Should be called to get access to existing contract on a blockchain
 *
 * @method at
 * @param {string} address - contract address
 * @param {Function} [callback] - optional callback.
 * @returns {Contract} returns contract if no callback was passed,
 * otherwise calls callback function (err, contract)
 */
ContractFactory.prototype.at = function (address, callback) {
    var of = this._outputFormatter || function(outputData, output){return output;};
    var contractAt = new Contract(this.abi, address, this._pipe, of);
    if(!callback){
        return contractAt;
    } else {
        callback(null, contractAt);
    }
};

ContractFactory.prototype.setOutputFormatter = function(outputFormatter){
    this._outputFormatter = outputFormatter;
};

/**
 * The contract type. This class is instantiated internally through the factory.
 *
 * @method Contract
 * @param {Array} abi
 * @param {string} address
 * @param {pipe} pipe;
 * @param {Function} outputFormatter - the output formatter.
 */
var Contract = function (abi, address, pipe, outputFormatter) {
    this.address = address;
    // TODO avoid conflict somehow.
    this.abi = abi;
    addFunctionsToContract(this, pipe, outputFormatter);
    addEventsToContract(this, pipe);
};



exports.contract = contract;
exports.init = init;

exports.newContractManager = function(pipe) {
    return new ContractManager(pipe);
};

exports.getPipe = function(){
    return pipe;
};
