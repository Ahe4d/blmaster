/*
  BLID Tools
  by Ahead (https://github.com/Ahe4d)
  
  A set of functions used for converting between key ID and BLID and generating a new key.
  Replaced the prefixToBLID and blidToPrefix functions in Blockauth.
*/

let charmap = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // characters that can be used in a key, excluding I, O, 1, 0
let len = 12; // max length of a key (excluding keyid)

exports.keyToBLID = function (key) {
  let power = 1048576;
  let blid = 0; 
  for (i=0;i<5;i++) {
    blid += power * charmap.indexOf(key.substring(i, i + 1)); 
    power /= 32;
  }
  return blid; 
}

exports.BLIDToKey = function (blid) {
  let key = ""; 
  let power = 1048576;
  let v = [0, 0, 0, 0, 0, 0];
  for (i=0;i<5;i++) { 
    while (blid >= power) { 
      blid -= power; 
      v[i]++; 
    }
    power /= 32;
  }
  for (i=0;i<5;i++) 
    key = key + charmap.substring(v[i]+0, v[i]+1); 

  return key; 
}

exports.generateKey = function () {
  let key = "";
  for (var i = 0; i < len; i++)
    key += charmap.charAt(Math.floor(Math.random() * charmap.length)); 

  return key;
}
