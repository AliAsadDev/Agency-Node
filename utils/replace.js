module.exports = function (str, options) {
  for (let key in options) {
    str = str.replace(new RegExp("{{" + key + "}}", "g"), options[key]);
  }
  return str;
};
