exports.uniqEs6 = arrArg => arrArg.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
exports.getRandomSubarray = (arr, size) => {
  let shuffled = arr.slice(0),
    i = arr.length,
    temp,
    index;
  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
};

exports.getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

exports.getSystole = () => {
  return this.getRandomInt( 110, 129)
}

exports.getDiastole = () => {
  return this.getRandomInt( 70, 79)
}

exports.getGDP = () => {
  return this.getRandomInt( 101, 130)
}

exports.getRR = () => {
  return this.getRandomInt( 18, 24)
}

exports.getHR = () => {
  return this.getRandomInt( 90, 98)
}

