const getRegex = (regex = '') => {
  if (!regex) {
    return {
      $regex: '.*',
      $options: 'i'
    }
  }

  let processedRegex = regex
  if (regex.endsWith('\\')) {
    processedRegex = regex + '\\'
  }

  return {
    $regex: processedRegex,
    $options: 'i'
  }
}

module.exports = getRegex
